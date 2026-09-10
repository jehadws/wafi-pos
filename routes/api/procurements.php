<?php

use App\Http\Controllers\Dashboard\ProcurementController;
use App\Http\Middleware\SbRestrictMiddleware;
use Illuminate\Support\Facades\Route;

Route::get( 'procurements/{id?}', [ ProcurementController::class, 'list' ] )->where( 'id', '[0-9]+' );
Route::get( 'procurements/{id}/products', [ ProcurementController::class, 'procurementProducts' ] );
Route::get( 'procurements/{id}/refresh', [ ProcurementController::class, 'refreshProcurement' ] )->middleware( SbRestrictMiddleware::arguments( 'subul.update.procurements' ) );
Route::get( 'procurements/{procurement}/set-as-paid', [ ProcurementController::class, 'setAsPaid' ] )->middleware( SbRestrictMiddleware::arguments( 'subul.update.procurements' ) );
Route::get( 'procurements/preload/{uuid}', [ ProcurementController::class, 'preload' ] );

Route::post( 'procurements/preload', [ ProcurementController::class, 'storePreload' ] );
Route::post( 'procurements/{id}/products', [ ProcurementController::class, 'procure' ] )->middleware( SbRestrictMiddleware::arguments( 'subul.update.procurements' ) );
Route::post( 'procurements', [ ProcurementController::class, 'create' ] )->middleware( SbRestrictMiddleware::arguments( 'subul.create.procurements' ) );
Route::post( 'procurements/products/search-procurement-product', [ ProcurementController::class, 'searchProcurementProduct' ] );
Route::post( 'procurements/products/search-product', [ ProcurementController::class, 'searchProduct' ] );

Route::put( 'procurements/{procurement}', [ ProcurementController::class, 'edit' ] )->middleware( SbRestrictMiddleware::arguments( 'subul.update.procurements' ) );
Route::put( 'procurements/{procurement}/change-payment-status', [ ProcurementController::class, 'changePaymentStatus' ] )->middleware( SbRestrictMiddleware::arguments( 'subul.update.procurements' ) );
Route::put( 'procurements/{id}/products/{product_id}', [ ProcurementController::class, 'editProduct' ] )->middleware( SbRestrictMiddleware::arguments( 'subul.update.procurements' ) );
Route::put( 'procurements/{id}/products', [ ProcurementController::class, 'bulkUpdateProducts' ] )->middleware( SbRestrictMiddleware::arguments( 'subul.update.procurements' ) );

Route::delete( 'procurements/{id}/products/{product_id}', [ ProcurementController::class, 'deleteProcurementProduct' ] )->middleware( SbRestrictMiddleware::arguments( 'subul.delete.procurements' ) );
Route::delete( 'procurements/{id}', [ ProcurementController::class, 'deleteProcurement' ] )->where( 'id', '[0-9]+' )->middleware( SbRestrictMiddleware::arguments( 'subul.delete.procurements' ) );

