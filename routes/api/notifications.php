<?php

use App\Http\Controllers\Dashboard\NotificationsController;
use Illuminate\Support\Facades\Route;

Route::get( 'notifications', [ NotificationsController::class, 'getNotifications' ] )->name( 'sb.notifications.get' );
Route::delete( 'notifications/all', [ NotificationsController::class, 'deleteAllNotifications' ] )->name( 'sb.notifications.clear' );
Route::delete( 'notifications/{id}', [ NotificationsController::class, 'deleteSingleNotification' ] )->where( [ 'id' => '[0-9]+' ] )->name( 'sb.notifications.delete' );
