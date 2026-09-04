<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers;

use App\Classes\JsonResponse;
use App\Http\Requests\ApplicationConfigRequest;
use App\Services\Helper;
use App\Services\SetupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            return redirect()->route( 'sb.dashboard.home' );
        }

        // The wizard always starts at the welcome step. If the user needs to
        // reconfigure the database, they can navigate to the database step
        // freely. The previous behaviour of auto-skipping to the configuration
        // step when DB credentials existed caused a back-button loop that
        // prevented reconfiguration.
        return inertia( 'setup/wizard', [
            'store_name'   => config( 'app.name' ),
            'languages'    => config( 'subul.languages', [] ),
            'default_lang' => $request->query( 'lang' ) ?: 'en',
            'initial_step' => 'welcome',
        ] );
    }

    public function checkDatabase( Request $request )
    {
        return $this->setup->saveDatabaseSettings( $request );
    }

    public function checkDbConfigDefined( Request $request )
    {
        return $this->setup->testDatabaseConnection();
    }

    public function saveConfiguration( ApplicationConfigRequest $request )
    {
        $result = $this->setup->runMigration( $request->all() );

        // Log the newly-created admin in. Auth::login() needs the session,
        // so it lives here in the controller rather than inside the service.
        if ( isset( $result['user'] ) ) {
            Auth::login( $result['user'] );
            unset( $result['user'] ); // don't expose the model in the JSON response
        }

        if ( $request->hasSession() ) {
            $request->session()->regenerate();
        }

        return $result;
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
