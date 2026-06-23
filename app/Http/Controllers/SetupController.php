<?php

/**
 * JgremPOS Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers;

use App\Classes\JsonResponse;
use App\Http\Requests\ApplicationConfigRequest;
use App\Services\Helper;
use App\Services\SetupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SetupController extends Controller
{
    public function __construct( private SetupService $setup )
    {
        // ...
    }

    public function welcome( Request $request )
    {
        // If the app is already fully installed, redirect away from setup.
        if ( Helper::installed() ) {
            return redirect()->route( 'ns.dashboard.home' );
        }

        // Determine the furthest step the user has already completed so we can
        // open the wizard at the right position instead of always at welcome.
        $initialStep = 'welcome';

        $dbConnection = env( 'DB_CONNECTION' );
        $dbDatabase   = env( 'DB_DATABASE' );

        if ( $dbConnection && $dbDatabase ) {
            try {
                DB::connection()->getPdo();
                // DB credentials exist and connection works → skip to configuration.
                $initialStep = 'configuration';
            } catch ( \Exception ) {
                // Credentials saved but DB unreachable → go back to database step.
                $initialStep = 'database';
            }
        }

        return inertia( 'setup/wizard', [
            'store_name'   => config( 'app.name' ),
            'languages'    => config( 'jgrem.languages', [] ),
            'default_lang' => $request->query( 'lang' ) ?: 'en',
            'initial_step' => $initialStep,
        ] );
    }

    public function checkDatabase( Request $request )
    {
        return $this->setup->saveDatabaseSettings( $request );
    }

    public function checkDbConfigDefined( Request $request )
    {
        return $this->setup->testDBConnexion();
    }

    public function saveConfiguration( ApplicationConfigRequest $request )
    {
        return $this->setup->runMigration( $request->all() );
    }

    public function checkExistingCredentials()
    {
        try {
            // When the driver is sqlite and DB_DATABASE is empty or absent, fall back to
            // the default path so the connection attempt doesn't fail on an empty filename.
            if ( env( 'DB_CONNECTION', 'mysql' ) === 'sqlite' ) {
                $dbPath = env( 'DB_DATABASE' );
                if ( empty( $dbPath ) ) {
                    config( [ 'database.connections.sqlite.database' => database_path( 'database.sqlite' ) ] );
                }
            }

            if ( DB::connection()->getPdo() ) {
                // Read-only check — do NOT write to .env here.
                return JsonResponse::success( [
                    'message' => __( 'The database connection has been successfully established.' ),
                ] );
            }
        } catch ( \Exception $e ) {
            return JsonResponse::error( [
                'message' => $e->getMessage(),
            ] );
        }
    }
}
