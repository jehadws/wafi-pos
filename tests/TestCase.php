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
