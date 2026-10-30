<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class GenerateInstallerTemplateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subul:installer-template
                            {--output=database/installer-template.sqlite}
                            {--force : Overwrite any existing template without asking}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generates a schema-only SQLite template used to seed fresh desktop installs (never ships developer data).';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $output   = $this->option( 'output' );
        $absolute = ( str_starts_with( $output, '/' ) || preg_match( '/^[A-Za-z]:[\/\\\\]/', $output ) )
            ? $output
            : base_path( $output );

        if ( File::exists( $absolute ) && ! File::delete( $absolute ) ) {
            throw new RuntimeException( "Unable to delete existing template: $absolute" );
        }

        /**
         * Point the sqlite connection at the template file and drop any cached
         * connection before migrating — the developer database.sqlite is never
         * read or written by this command.
         */
        config( [ 'database.connections.sqlite.database' => $absolute ] );
        DB::purge( 'sqlite' );

        /**
         * The template carries ONLY the framework tables (cache, sessions,
         * jobs, ...) with the root migrations recorded, so the database-driven
         * session/cache drivers work and the setup wizard's own `migrate`
         * call is a no-op. The business schema (core/create migrations), the
         * "update" markers, the admin account and the default options are
         * ALL created by the /do-setup wizard (SetupService::runMigration) —
         * it unconditionally executes the core/create migration files, so
         * pre-running them here would make the wizard crash with
         * "table already exists". The developer database.sqlite is never
         * read or written by this command.
         */
        Artisan::call( 'migrate', [ '--force' => true ], $this->output );

        /**
         * Sanity probe: the app must be able to boot (framework tables
         * present), but the business schema must be left to the wizard.
         */
        foreach ( [ 'sessions', 'cache', 'cache_locks', 'migrations' ] as $required ) {
            if ( ! Schema::hasTable( $required ) ) {
                throw new RuntimeException( "Template is missing the required framework table [$required]." );
            }
        }

        foreach ( [ 'subul_options', 'subul_users' ] as $business ) {
            if ( Schema::hasTable( $business ) ) {
                throw new RuntimeException( "Template must not carry the business table [$business] — the setup wizard creates it." );
            }
        }

        $this->info( "Installer template generated (framework tables only): $absolute" );

        return self::SUCCESS;
    }
}
