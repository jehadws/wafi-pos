<?php

use App\Http\Middleware\InstalledStateMiddleware;
use Illuminate\Support\Facades\Route;

require __DIR__ . '/settings.php';
require __DIR__ . '/web-base.php';

// Auth routes must also be guarded by the installation check.
// If the app is not installed, any visit to /login, /register, etc.
// should redirect the user to the setup wizard.
Route::middleware([InstalledStateMiddleware::class])->group(function () {
    require __DIR__ . '/auth.php';
});

require __DIR__ . '/api.php';
