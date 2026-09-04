<?php

use App\Http\Controllers\Dashboard\ProcurementController;
use Illuminate\Support\Facades\Route;

Route::get( '/procurements', [ ProcurementController::class, 'listProcurements' ] )->name( sb()->routeName( 'sb.dashboard.procurement-list' ) ); // @todo update
Route::get( '/procurements/create', [ ProcurementController::class, 'createProcurement' ] )->name( sb()->routeName( 'sb.dashboard.procurement-create' ) ); // @todo update
Route::get( '/procurements/products', [ ProcurementController::class, 'getProcurementProducts' ] )->name( sb()->routeName( 'sb.dashboard.procurement-products' ) ); // @todo update
Route::get( '/procurements/products/edit/{product}', [ ProcurementController::class, 'editProcurementProduct' ] )->name( sb()->routeName( 'sb.dashboard.procurement-edit-products' ) ); // @todo update
Route::get( '/procurements/edit/{procurement}', [ ProcurementController::class, 'updateProcurement' ] )->name( sb()->routeName( 'sb.dashboard.procurement-edit' ) ); // @todo update
Route::get( '/procurements/edit/{procurement}/invoice', [ ProcurementController::class, 'procurementInvoice' ] )->name( sb()->routeName( 'sb.dashboard.procurement-invoice' ) ); // @todo update
