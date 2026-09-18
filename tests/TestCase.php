<?php

namespace Tests;

use App\Models\License;
use App\Services\HwidService;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        /**
         * The application's schema lives in database/migrations/{core,create},
         * which are normally executed by the setup wizard (SetupService) on
         * fresh installs — plain `artisan migrate` only discovers root-level
         * migrations. The in-memory test database therefore never receives
         * them, so we run them here after RefreshDatabase has migrated.
         */
        sb()->update
            ->getMigrations(
                directories: [ 'core', 'create' ],
                ignoreMigrations: true
            )
            ->each( function ( $file ) {
                sb()->update->executeMigrationFromFileName( $file );
            } );

        /**
         * Fresh installs (SetupService::runMigration) mark the `update`
         * migrations as assumed-executed — their changes are integrated in
         * the `create` files. Without this, `CheckMigrationStatus` sees
         * pending migrations and redirects every dashboard route to
         * /database-update.
         */
        sb()->update
            ->getMigrations(
                directories: [ 'update' ],
                ignoreMigrations: true
            )
            ->each( function ( $file ) {
                sb()->update->assumeExecuted( $file );
            } );

        /**
         * The permission gates are registered by AuthServiceProvider::boot,
         * which runs BEFORE this schema exists — `Permission::get()` then
         * resolves against an empty database and defines no gates. Flush the
         * array cache (per-user permission caches would otherwise leak across
         * tests through reused auto-increment user ids) and re-register the
         * gates now that the schema is migrated — the same thing
         * SetupService does right after a fresh install.
         */
        \Illuminate\Support\Facades\Cache::flush();

        sb()->registerGatePermissions();

        \Illuminate\Support\Facades\Cache::forget( 'sb-core-installed' );

        /**
         * LicenseMiddleware enforces an activated terminal license for every
         * non-auth route. Tests run without a signed license key, so record
         * an active license for this machine's hardware ID.
         */
        License::firstOrCreate(
            [ 'hwid' => HwidService::generate() ],
            [
                'is_active'    => true,
                'device_name'  => 'Test Terminal',
                'activated_at' => now(),
            ]
        );
    }
}
