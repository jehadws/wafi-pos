<?php

use App\Http\Controllers\Dashboard\ReportsController;
use Illuminate\Support\Facades\Route;

Route::get('/reports/sales', [ReportsController::class, 'salesReport'])->name(sb()->routeName('sb.dashboard.report.sales'));
Route::get('/reports/sales-progress', [ReportsController::class, 'salesProgress'])->name(sb()->routeName('sb.dashboard.report.sale-progress'));
Route::get('/reports/low-stock', [ReportsController::class, 'stockReport'])->name(sb()->routeName('sb.dashboard.reports-low-stock')); // @todo update
Route::get('/reports/sold-stock', [ReportsController::class, 'soldStock'])->name(sb()->routeName('sb.dashboard.reports.sold-stock'));
Route::get('/reports/stock-history', [ReportsController::class, 'stockCombinedReport'])->name(sb()->routeName('sb.dashboard.reports.stock-history'));
Route::get('/reports/profit', [ReportsController::class, 'profit'])->name(sb()->routeName('sb.dashboard.reports.profit'));
Route::get('/reports/transactions', [ReportsController::class, 'transactionsReport'])->name(sb()->routeName('sb.dashboard.reports.transactions'));
Route::get('/reports/annual-report', [ReportsController::class, 'annualReport'])->name(sb()->routeName('sb.dashboard.reports-annual')); // @todo update
Route::get('/reports/payment-types', [ReportsController::class, 'salesByPaymentTypes'])->name(sb()->routeName('sb.dashboard.reports.payment-types'));
Route::get('/reports/customers-statement', [ReportsController::class, 'showCustomerStatement'])->name(sb()->routeName('sb.dashboard.reports.customers-statement'));
