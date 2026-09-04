<?php

use App\Http\Middleware\InstalledStateMiddleware;
use Illuminate\Support\Facades\Route;

Route::middleware([InstalledStateMiddleware::class])->group(function () {
    require __DIR__ . '/settings.php';
    require __DIR__ . '/auth.php';
});

require __DIR__ . '/web-base.php';
require __DIR__ . '/api.php';
