<?php

use App\Http\Controllers\Dashboard\ProductsController;
use App\Http\Middleware\SbRestrictMiddleware;
use Illuminate\Support\Facades\Route;

Route::get('products', [ProductsController::class, 'getProduts']);
Route::get('products/all/variations', [ProductsController::class, 'getAllVariations']);
Route::get('products/{identifier}', [ProductsController::class, 'singleProduct']);
Route::get('products/{identifier}/variations', [ProductsController::class, 'getProductVariations']);

// @deprecated
Route::get('products/{identifier}/refresh-prices', [ProductsController::class, 'refreshPrices']);
Route::get('products/{identifier}/reset', [ProductsController::class, 'reset']);
Route::get('products/{identifier}/history', [ProductsController::class, 'history']);

// @todo duplicate of /products/{identifier}/units/quantities
Route::get('products/{identifier}/units', [ProductsController::class, 'units']);
Route::get('products/{product}/units/{unit}/quantity', [ProductsController::class, 'getUnitQuantity']);

// @todo duplicate of /products/{identifier}/units
Route::get('products/{product}/units/quantities', [ProductsController::class, 'getUnitQuantities']);
Route::get('products/{product}/procurements', [ProductsController::class, 'getProcuredProducts']);
Route::get('products/search/using-barcode/{product}', [ProductsController::class, 'searchUsingArgument']);

Route::middleware([
  SbRestrictMiddleware::arguments('subul.delete.products'),
])->group(function () {
  Route::delete('products/{identifier}', [ProductsController::class, 'deleteProduct']);
  Route::delete('products/units/quantity/{unitQuantity}', [ProductsController::class, 'deleteUnitQuantity']);
  Route::delete('products/all/variations', [ProductsController::class, 'deleteAllVariations']);
  Route::delete('products/{identifier}/variations/{variation_id}', [ProductsController::class, 'deleteSingleVariation']);
  Route::delete('products', [ProductsController::class, 'deleteAllProducts']);
});

Route::post('products', [ProductsController::class, 'saveProduct'])->middleware(SbRestrictMiddleware::arguments('subul.create.products'))->name('sb.products.saveProduct');
Route::post('products/search', [ProductsController::class, 'searchProduct'])->middleware(SbRestrictMiddleware::arguments('subul.read.products'));
Route::post('products/adjustments', [ProductsController::class, 'createAdjustment'])->middleware(SbRestrictMiddleware::arguments('subul.update.products'));
Route::post('products/{identifier}/variations/{variation_id}', [ProductsController::class, 'createSingleVariation'])->middleware(SbRestrictMiddleware::arguments('subul.create.products'));
Route::post('products/{product}/units/conversion', [ProductsController::class, 'convertUnits'])->middleware(SbRestrictMiddleware::arguments('subul.update.products'));

Route::put('products/{identifier}/variations/{variation_id}', [ProductsController::class, 'editSingleVariation'])->middleware(SbRestrictMiddleware::arguments('subul.update.products'));
Route::put('products/{product}', [ProductsController::class, 'updateProduct'])->middleware(SbRestrictMiddleware::arguments('subul.update.products'));
