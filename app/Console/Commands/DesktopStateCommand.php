<?php

namespace App\Console\Commands;

use App\Services\Helper;
use App\Services\UpdateService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class DesktopStateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subul:desktop-state';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Prints the install state the desktop shell bootstraps from as JSON.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $installed = Helper::installed();

        $this->line( json_encode( [
            'installed' => $installed,
            'version' => config( 'subul.version' ),
            'connection' => DB::getDefaultConnection(),
            'database' => $this->databaseName(),
            'pending_migrations' => $installed ? $this->pendingMigrations() : 0,
        ], JSON_UNESCAPED_SLASHES ) );

        return self::SUCCESS;
    }

    /**
     * The SQLite file this process would open, or the MySQL database name.
     * Never throws: a broken connection must still produce parseable state.
     */
    private function databaseName(): ?string
    {
        try {
            return DB::connection()->getDatabaseName();
        } catch ( Throwable ) {
            return null;
        }
    }

    /**
     * Root framework migrations not yet recorded, plus the pending
     * core/create/update files the update page would list.
     */
    private function pendingMigrations(): int
    {
        try {
            $migrator = app( 'migrator' );
            $frameworkFiles = $migrator->getMigrationFiles( [ database_path( 'migrations' ) ] );
            $pendingFramework = array_diff( array_keys( $frameworkFiles ), $migrator->getRepository()->getRan() );
            $pendingFiles = app( UpdateService::class )->getMigrations()->count();

            return count( $pendingFramework ) + $pendingFiles;
        } catch ( Throwable ) {
            return 0;
        }
    }
}
