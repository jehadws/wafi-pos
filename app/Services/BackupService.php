<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use PDO;
use RuntimeException;
use Throwable;

class BackupService
{
    public const SNAPSHOT_PREFIX = 'subul-';

    public const SAFETY_PREFIX = 'pre-restore-';

    public const RETENTION_DAYS = 30;

    public const RETENTION_FILES = 30;

    /**
     * Where snapshots live. The desktop shell points SUBUL_BACKUP_DIR at the
     * per-user data folder so backups survive a reinstall; a browser install
     * falls back to the application storage directory.
     */
    public function directory( ?string $override = null ): string
    {
        $directory = $override ?: env( 'SUBUL_BACKUP_DIR' ) ?: storage_path( 'backups' );
        $directory = rtrim( (string) $directory, '\\/' );

        if ( ! is_dir( $directory ) && ! @mkdir( $directory, 0755, true ) && ! is_dir( $directory ) ) {
            throw new RuntimeException( "The backup directory could not be created: {$directory}" );
        }

        return $directory;
    }

    /**
     * The SQLite file this application reads and writes.
     */
    public function databasePath(): string
    {
        $connection = config( 'database.default' );
        $driver = config( "database.connections.{$connection}.driver" );

        if ( $driver !== 'sqlite' ) {
            throw new RuntimeException( 'Backups are only available for SQLite databases.' );
        }

        $path = (string) config( "database.connections.{$connection}.database" );

        if ( $path === '' || $path === ':memory:' ) {
            throw new RuntimeException( 'The SQLite database has no file to back up.' );
        }

        if ( ! $this->isAbsolutePath( $path ) ) {
            $path = base_path( $path );
        }

        return $path;
    }

    /**
     * Writes a verified snapshot next to the previous ones and applies
     * retention. Throws when the database is unreadable or the copy cannot
     * be proven intact, so callers never mistake a missing backup for success.
     *
     * @return array{file: string, size: int, pruned: int}
     */
    public function create(
        int $retainDays = self::RETENTION_DAYS,
        int $retainFiles = self::RETENTION_FILES,
        ?string $directory = null
    ): array {
        $directory = $this->directory( $directory );
        $database = $this->databasePath();

        if ( ! is_file( $database ) ) {
            throw new RuntimeException( 'The database file does not exist yet.' );
        }

        $path = $this->uniquePath( $directory, self::SNAPSHOT_PREFIX . date( 'Ymd-His' ) . '.sqlite' );
        $temporary = $path . '.' . getmypid() . '.tmp';

        try {
            $this->snapshotTo( $database, $temporary );

            if ( ! $this->verify( $temporary ) ) {
                throw new RuntimeException( 'The snapshot failed its integrity check.' );
            }

            if ( ! @rename( $temporary, $path ) ) {
                throw new RuntimeException( 'The snapshot could not be moved into place.' );
            }
        } finally {
            if ( is_file( $temporary ) ) {
                @unlink( $temporary );
            }
        }

        clearstatcache( true, $path );

        $pruned = $this->prune( $directory, $retainDays, $retainFiles, $path );

        return [
            'file' => $path,
            'size' => (int) ( filesize( $path ) ?: 0 ),
            'pruned' => $pruned,
        ];
    }

    /**
     * A backup is only usable when SQLite itself agrees the file is intact and
     * it carries the tables a store needs. A zero-byte or half-written file is
     * rejected here rather than discovered during a restore.
     */
    public function verify( string $file ): bool
    {
        if ( ! is_file( $file ) || ( filesize( $file ) ?: 0 ) === 0 ) {
            return false;
        }

        try {
            $pdo = $this->open( $file );
            $result = $pdo->query( 'PRAGMA integrity_check' )->fetchAll( PDO::FETCH_COLUMN );

            if ( $result !== [ 'ok' ] ) {
                return false;
            }

            $tables = $pdo->query( "SELECT name FROM sqlite_master WHERE type = 'table'" )
                ->fetchAll( PDO::FETCH_COLUMN );
            $prefix = (string) config( 'database.connections.' . config( 'database.default' ) . '.prefix' );

            return in_array( $prefix . 'migrations', $tables, true )
                && in_array( $prefix . 'subul_options', $tables, true );
        } catch ( Throwable ) {
            return false;
        }
    }

    /**
     * Newest first.
     *
     * @return array<int, array{file: string, size: int, created_at: int}>
     */
    public function snapshots( ?string $directory = null ): array
    {
        $directory = $this->directory( $directory );
        $files = glob( $directory . DIRECTORY_SEPARATOR . '*.sqlite' ) ?: [];
        $snapshots = [];

        foreach ( $files as $file ) {
            $name = basename( $file );

            if ( ! str_starts_with( $name, self::SNAPSHOT_PREFIX ) && ! str_starts_with( $name, self::SAFETY_PREFIX ) ) {
                continue;
            }

            $snapshots[] = [
                'file' => $file,
                'size' => (int) ( filesize( $file ) ?: 0 ),
                'created_at' => (int) ( filemtime( $file ) ?: 0 ),
            ];
        }

        usort( $snapshots, fn( $a, $b ) => $b['created_at'] <=> $a['created_at'] );

        return $snapshots;
    }

    /**
     * The most recent snapshot that passes verification, skipping damaged
     * files left behind by an interrupted write.
     *
     * @return array{file: string, size: int, created_at: int}|null
     */
    public function latestVerified( ?string $directory = null ): ?array
    {
        foreach ( $this->snapshots( $directory ) as $snapshot ) {
            // A pre-restore copy is the database exactly as it was when it was
            // replaced, so it is not a candidate for "go back one step".
            if ( str_starts_with( basename( $snapshot['file'] ), self::SAFETY_PREFIX ) ) {
                continue;
            }

            if ( $this->verify( $snapshot['file'] ) ) {
                return $snapshot;
            }
        }

        return null;
    }

    /**
     * Replaces the live database with a snapshot. The current database is kept
     * as a pre-restore safety copy, and a failed swap is rolled back to it.
     *
     * @return array{restored: string, database: string, safety: string|null}
     */
    public function restore( string $file, ?string $directory = null ): array
    {
        $directory = $this->directory( $directory );
        $source = $this->resolveSnapshot( $file, $directory );
        $database = $this->databasePath();

        if ( ! $this->verify( $source ) ) {
            throw new RuntimeException( 'The selected backup failed its integrity check.' );
        }

        // The live database must not have open handles while it is replaced.
        DB::purge();

        $safety = null;

        if ( is_file( $database ) ) {
            $safety = $this->uniquePath( $directory, self::SAFETY_PREFIX . date( 'Ymd-His' ) . '.sqlite' );

            try {
                $this->snapshotTo( $database, $safety );
            } catch ( Throwable ) {
                // A damaged database cannot always be vacuumed; keep its bytes
                // anyway so a technician can inspect what was replaced.
                $safety = $this->rawCopy( $database, $safety );
            }

            if ( $safety === null ) {
                throw new RuntimeException( 'The current database could not be copied safely, so nothing was restored.' );
            }
        }

        $temporary = $database . '.restore-' . getmypid() . '.tmp';

        try {
            if ( ! @copy( $source, $temporary ) ) {
                throw new RuntimeException( 'The backup could not be staged for restore.' );
            }

            if ( ! $this->verify( $temporary ) ) {
                throw new RuntimeException( 'The staged backup failed its integrity check.' );
            }

            $this->removeSidecars( $database );

            if ( is_file( $database ) && ! @unlink( $database ) ) {
                throw new RuntimeException( 'The live database is locked and could not be replaced.' );
            }

            if ( ! @rename( $temporary, $database ) ) {
                $this->rollback( $safety, $database );
                throw new RuntimeException( 'The restored database could not be moved into place.' );
            }
        } finally {
            if ( is_file( $temporary ) ) {
                @unlink( $temporary );
            }
        }

        if ( ! $this->verify( $database ) ) {
            $this->rollback( $safety, $database );
            throw new RuntimeException( 'The restored database failed its integrity check and was rolled back.' );
        }

        DB::purge();

        return [
            'restored' => $source,
            'database' => $database,
            'safety' => $safety,
        ];
    }

    /**
     * Deletes snapshots beyond the age or count limits. The snapshot passed as
     * $keep, and anything newer, always survives the run that created it.
     */
    public function prune(
        string $directory,
        int $retainDays = self::RETENTION_DAYS,
        int $retainFiles = self::RETENTION_FILES,
        ?string $keep = null
    ): int {
        $cutoff = time() - max( 1, $retainDays ) * 86400;
        $remaining = 0;
        $deleted = 0;

        foreach ( $this->snapshots( $directory ) as $snapshot ) {
            if ( $keep !== null && $snapshot['file'] === $keep ) {
                $remaining++;

                continue;
            }

            $expired = $snapshot['created_at'] < $cutoff;
            $overLimit = $remaining >= max( 1, $retainFiles );

            if ( $expired || $overLimit ) {
                if ( @unlink( $snapshot['file'] ) ) {
                    $deleted++;
                }

                continue;
            }

            $remaining++;
        }

        return $deleted;
    }

    /**
     * VACUUM INTO produces a consistent copy, including commits still sitting
     * in the WAL, and cannot be run inside a transaction.
     */
    private function snapshotTo( string $database, string $target ): void
    {
        if ( is_file( $target ) ) {
            @unlink( $target );
        }

        $lastError = null;

        for ( $attempt = 1; $attempt <= 3; $attempt++ ) {
            try {
                $pdo = $this->open( $database );
                $pdo->exec( 'PRAGMA busy_timeout = 10000' );
                $statement = $pdo->prepare( 'VACUUM INTO ?' );
                $statement->execute( [ $target ] );

                return;
            } catch ( Throwable $e ) {
                $lastError = $e;

                if ( is_file( $target ) ) {
                    @unlink( $target );
                }

                usleep( 250000 * $attempt );
            }
        }

        throw new RuntimeException(
            'The database could not be snapshotted: ' . ( $lastError?->getMessage() ?: 'unknown error' ),
            0,
            $lastError
        );
    }

    private function open( string $file ): PDO
    {
        return new PDO( 'sqlite:' . $file, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 10,
        ] );
    }

    /**
     * A restore may only read files that really live in the backup directory,
     * so a caller cannot be tricked into replacing the database with anything
     * else on disk.
     */
    private function resolveSnapshot( string $file, string $directory ): string
    {
        $candidate = $this->isAbsolutePath( $file )
            ? $file
            : $directory . DIRECTORY_SEPARATOR . $file;

        $resolved = realpath( $candidate );
        $resolvedDirectory = realpath( $directory );

        if ( $resolved === false || $resolvedDirectory === false || ! is_file( $resolved ) ) {
            throw new RuntimeException( 'The backup file could not be found.' );
        }

        $normalizedFile = strtolower( str_replace( '\\', '/', $resolved ) );
        $normalizedDirectory = rtrim( strtolower( str_replace( '\\', '/', $resolvedDirectory ) ), '/' ) . '/';

        if ( ! str_starts_with( $normalizedFile, $normalizedDirectory ) ) {
            throw new RuntimeException( 'The backup file must live in the backup directory.' );
        }

        return $resolved;
    }

    /**
     * Byte-for-byte fallback for a database VACUUM cannot read. Returns null
     * instead of throwing so the caller can report one clear failure.
     */
    private function rawCopy( string $database, string $target ): ?string
    {
        if ( @copy( $database, $target ) ) {
            return $target;
        }

        if ( is_file( $target ) ) {
            @unlink( $target );
        }

        return null;
    }

    private function rollback( ?string $safety, string $database ): void
    {
        if ( $safety === null || ! is_file( $safety ) ) {
            return;
        }

        $this->removeSidecars( $database );

        if ( is_file( $database ) ) {
            @unlink( $database );
        }

        @rename( $safety, $database );
    }

    private function removeSidecars( string $database ): void
    {
        foreach ( [ '-wal', '-shm', '-journal' ] as $suffix ) {
            if ( is_file( $database . $suffix ) ) {
                @unlink( $database . $suffix );
            }
        }
    }

    private function uniquePath( string $directory, string $name ): string
    {
        $path = $directory . DIRECTORY_SEPARATOR . $name;

        if ( ! file_exists( $path ) ) {
            return $path;
        }

        $extension = pathinfo( $name, PATHINFO_EXTENSION );
        $base = pathinfo( $name, PATHINFO_FILENAME );
        $counter = 2;

        do {
            $path = $directory . DIRECTORY_SEPARATOR . $base . '-' . $counter++ . '.' . $extension;
        } while ( file_exists( $path ) );

        return $path;
    }

    private function isAbsolutePath( string $path ): bool
    {
        return (bool) preg_match( '/^(?:[A-Za-z]:[\\\\\\/]|\\\\|\\/)/', $path );
    }
}
