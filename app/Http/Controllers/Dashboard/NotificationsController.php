<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\DashboardController;
use App\Models\Notification;
use App\Services\DateService;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;

class NotificationsController extends DashboardController
{
    public function __construct(
        protected NotificationService $notificationService,
        protected DateService $dateService
    ) {
        // ...
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function getNotifications()
    {
        return response()->json(
            Notification::for( Auth::id() )->orderBy( 'id', 'desc' )->get()
        );
    }

    /**
     * @param int|string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteSingleNotification( $id )
    {
        try {
            $this->notificationService->deleteSingleNotification( $id );

            return response()->json([
                'status' => 'success',
                'message' => __( 'The notification has been successfully deleted' ),
            ]);
        } catch ( \Exception $e ) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteAllNotifications()
    {
        $this->notificationService->deleteNotificationsFor( Auth::user() );

        return response()->json([
            'status' => 'success',
            'message' => __( 'All the notifications have been cleared.' ),
        ]);
    }

    /**
     * Alias for backwards compatibility
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function deletAllNotifications()
    {
        return $this->deleteAllNotifications();
    }
}
