<?php

use App\Http\Controllers\Dashboard\ProcurementController;
use Illuminate\Support\Facades\Route;

Route::get( '/procurements', [ ProcurementController::class, 'listProcurements' ] )->name( ns()->routeName( 'ns.dashboard.procurement-list' ) ); // @todo update
Route::get( '/procurements/create', [ ProcurementController::class, 'createProcurement' ] )->name( ns()->routeName( 'ns.dashboard.procurement-create' ) ); // @todo update
Route::get( '/procurements/products', [ ProcurementController::class, 'getProcurementProducts' ] )->name( ns()->routeName( 'ns.dashboard.procurement-products' ) ); // @todo update
Route::get( '/procurements/products/edit/{product}', [ ProcurementController::class, 'editProcurementProduct' ] )->name( ns()->routeName( 'ns.dashboard.procurement-edit-products' ) ); // @todo update
Route::get( '/procurements/edit/{procurement}', [ ProcurementController::class, 'updateProcurement' ] )->name( ns()->routeName( 'ns.dashboard.procurement-edit' ) ); // @todo update
Route::get( '/procurements/edit/{procurement}/invoice', [ ProcurementController::class, 'procurementInvoice' ] )->name( ns()->routeName( 'ns.dashboard.procurement-invoice' ) ); // @todo update
