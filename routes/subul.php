<?php

use App\Http\Controllers\DashboardController;
use App\Http\Middleware\SbRestrictMiddleware;
use Illuminate\Support\Facades\Route;

Route::get('', [DashboardController::class, 'home'])->name('sb.dashboard.home')
  ->middleware([SbRestrictMiddleware::arguments('read.dashboard')]);

include dirname(__FILE__) . '/web/orders.php';
include dirname(__FILE__) . '/web/medias.php';
include dirname(__FILE__) . '/web/customers.php';
include dirname(__FILE__) . '/web/cash-registers.php';
include dirname(__FILE__) . '/web/procurements.php';
include dirname(__FILE__) . '/web/providers.php';
include dirname(__FILE__) . '/web/settings.php';
include dirname(__FILE__) . '/web/transactions.php';
include dirname(__FILE__) . '/web/products.php';
include dirname(__FILE__) . '/web/taxes.php';
include dirname(__FILE__) . '/web/units.php';
include dirname(__FILE__) . '/web/reports.php';
