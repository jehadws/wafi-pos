<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\DashboardController;
use App\Http\Requests\ResetRequest;
use App\Services\DateService;
use App\Services\DemoService;
use App\Services\ResetService;
use App\Services\SetupService;
use Illuminate\Http\JsonResponse;

class ResetController extends DashboardController
{
    public function __construct(
        protected ResetService $resetService,
        protected DemoService $demoService,
        protected DateService $dateService,
        protected SetupService $setupService
    ) {
        // ...
    }

    /**
     * Truncate the database and optionally seed demo data
     *
     * @param ResetRequest $request
     * @return JsonResponse
     */
    public function truncateWithDemo( ResetRequest $request ): JsonResponse
    {
        $validated = $request->validated();
        $mode = $validated['mode'] ?? 'wipe_all';

        // Perform soft reset to clear all transactions, orders, customers & options
        $this->resetService->softReset();

        switch ( $mode ) {
            case 'wipe_plus_grocery':
                $this->demoService->run( [
                    'mode' => 'wipe_plus_grocery',
                    'create_sales' => ! empty( $validated['create_sales'] ),
                    'create_procurements' => ! empty( $validated['create_procurements'] ),
                ] );
                $message = __( 'The database has been successfully reset and seeded with grocery demo data.' );
                break;

            case 'wipe_all':
                // Clean wipe without demo records
                $message = __( 'The database has been successfully wiped.' );
                break;

            default:
                $result = $this->resetService->handleCustom( $validated );
                if ( isset( $result['status'] ) && $result['status'] === 'error' ) {
                    return response()->json( $result, 422 );
                }
                $message = $result['message'] ?? __( 'Custom reset executed successfully.' );
                break;
        }

        return response()->json( [
            'status' => 'success',
            'message' => $message,
        ] );
    }
}
