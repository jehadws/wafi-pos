<?php

namespace App\Console\Commands;

use App\Services\BackupService;
use Illuminate\Console\Command;
use Throwable;

class BackupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subul:backup
        {--output-dir= : Directory that receives the snapshot}
        {--retain-days=30 : Delete snapshots older than this many days}
        {--retain-files=30 : Keep at most this many snapshots}
        {--verify-only : Report the newest verified snapshot without creating one}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Creates a verified SQLite snapshot and enforces backup retention.';

    /**
     * Execute the console command.
     */
    public function handle( BackupService $backups ): int
    {
        try {
            $directory = $this->option( 'output-dir' ) ?: null;

            if ( $this->option( 'verify-only' ) ) {
                $latest = $backups->latestVerified( $directory );

                if ( $latest === null ) {
                    throw new \RuntimeException( 'No verified snapshot is available.' );
                }

                $this->line( json_encode( [
                    'ok' => true,
                    'verified' => true,
                    'file' => $latest['file'],
                    'size' => $latest['size'],
                    'created_at' => $latest['created_at'],
                ], JSON_UNESCAPED_SLASHES ) );

                return self::SUCCESS;
            }

            $result = $backups->create(
                (int) $this->option( 'retain-days' ),
                (int) $this->option( 'retain-files' ),
                $directory
            );

            $this->line( json_encode( [
                'ok' => true,
                'verified' => true,
                'file' => $result['file'],
                'size' => $result['size'],
                'pruned' => $result['pruned'],
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
