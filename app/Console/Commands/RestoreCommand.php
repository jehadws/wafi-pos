<?php

namespace App\Console\Commands;

use App\Services\BackupService;
use Illuminate\Console\Command;
use RuntimeException;
use Throwable;

class RestoreCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subul:restore
        {file? : Snapshot filename or absolute path}
        {--latest : Restore the newest verified snapshot}
        {--force : Skip the confirmation prompt}
        {--output-dir= : Directory the snapshots live in}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Replaces the live database with a verified snapshot.';

    /**
     * Execute the console command.
     */
    public function handle( BackupService $backups ): int
    {
        try {
            $directory = $this->option( 'output-dir' ) ?: null;
            $file = $this->argument( 'file' );

            if ( $this->option( 'latest' ) ) {
                $latest = $backups->latestVerified( $directory );

                if ( $latest === null ) {
                    throw new RuntimeException( 'No verified snapshot is available.' );
                }

                $file = $latest['file'];
            }

            if ( ! $file ) {
                throw new RuntimeException( 'Provide a snapshot file or pass --latest.' );
            }

            if ( ! $this->option( 'force' ) && ! $this->confirm( "Replace the live database with {$file}?" ) ) {
                $this->line( json_encode( [
                    'ok' => false,
                    'error' => 'Restore cancelled.',
                ], JSON_UNESCAPED_SLASHES ) );

                return self::FAILURE;
            }

            $result = $backups->restore( $file, $directory );

            $this->line( json_encode( [
                'ok' => true,
                'restored' => $result['restored'],
                'database' => $result['database'],
                'safety' => $result['safety'],
            ], JSON_UNESCAPED_SLASHES ) );

            return self::SUCCESS;
        } catch ( Throwable $e ) {
            $this->line( json_encode( [
                'ok' => false,
                'error' => $e->getMessage(),
            ], JSON_UNESCAPED_SLASHES ) );

            return self::FAILURE;
        }
    }
}
