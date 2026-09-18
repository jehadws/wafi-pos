<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers;

use App\Events\AfterMigrationExecutedEvent;
use App\Services\ModulesService;
use App\Services\UpdateService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UpdateController extends Controller
{
    public function __construct(
        public ModulesService $modulesService,
        public UpdateService $updateService
    ) {
        // ...
    }

    public function updateDatabase(): Response
    {
        return Inertia::render( 'database/update', [
            'title' => __( 'Database Update' ),
            'redirect' => session( 'after_update', sb()->route( 'sb.dashboard.home' ) ),
            'migrations' => $this->updateService->getMigrations()->values()->toArray(),
            'modules' => collect( $this->modulesService->getEnabledAndAutoloadedModules() )->filter( fn( $module ) => count( $module[ 'migrations' ] ) > 0 )->values()->toArray(),
        ] );
    }

    public function runMigration( Request $request )
    {
        /**
         * Proceeding code migration.
         */
        if ( $request->input( 'file' ) ) {
            $this->updateService->executeMigrationFromFileName( file: $request->input( 'file' ) );
        }

        /**
         * proceeding the migration for
         * the provided module.
         */
        if ( $request->input( 'module' ) ) {
            $module = $request->input( 'module' );
            foreach ( $module[ 'migrations' ] as $file ) {
                $response = $this->modulesService->runMigration( $module[ 'namespace' ], $file );
                AfterMigrationExecutedEvent::dispatch( $module, $response, $file );
            }
        }

        return [
            'status' => 'success',
            'message' => __( 'The migration has successfully run.' ),
        ];
    }
}
