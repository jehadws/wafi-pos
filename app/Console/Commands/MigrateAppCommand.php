<?php

namespace App\Console\Commands;

use App\Services\UpdateService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Throwable;

class MigrateAppCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subul:migrate-app';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Runs the framework migrations then applies pending Subul migration files.';

    public function __construct(
        private UpdateService $updateService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $exitCode = $this->call( 'migrate', [ '--force' => true ] );

        if ( $exitCode !== self::SUCCESS ) {
            return self::FAILURE;
        }

        try {
            $pending = $this->updateService->getMigrations(
                ignoreMigrations: false,
                directories: [ 'core', 'create', 'update' ]
            );

            foreach ( $pending as $file ) {
                $this->line( "Migrating $file" );
                $this->updateService->executeMigrationFromFileName( $file );
            }
        } catch ( Throwable $e ) {
            $this->error( $e->getMessage() );

            return self::FAILURE;
        }

        /**
         * Helper::installed() caches its verdict for 60 seconds. A migration
         * that just created subul_options must not be followed by requests
         * that still believe the terminal is uninstalled.
         */
        Cache::forget( 'sb-core-installed' );

        $this->info( $pending->isEmpty() ? 'No pending Subul migrations.' : 'Subul migrations applied.' );

        return self::SUCCESS;
    }
}
