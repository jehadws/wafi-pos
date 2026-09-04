<?php

use App\Http\Controllers\Dashboard\SettingsController;
use Illuminate\Support\Facades\Route;

Route::get( '/settings/{settings}', [ SettingsController::class, 'getSettings' ] )->name( sb()->routeName( 'sb.dashboard.settings' ) );
