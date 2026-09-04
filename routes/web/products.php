<?php

use App\Http\Controllers\Dashboard\CategoryController;
use App\Http\Controllers\Dashboard\ProductsController;
use Illuminate\Support\Facades\Route;

Route::get('/products', [ProductsController::class, 'listProducts'])->name(sb()->routeName('sb.dashboard.products'));
Route::get('/products/create', [ProductsController::class, 'createProduct'])->name(sb()->routeName('sb.dashboard.products.create'));
Route::get('/products/stock-adjustment', [ProductsController::class, 'showStockAdjustment'])->name(sb()->routeName('sb.dashboard.products.stock-adjustment'));
Route::get('/products/print-labels', [ProductsController::class, 'printLabels'])->name(sb()->routeName('sb.dashboard.products.print-labels'));
Route::get('/products/edit/{product}', [ProductsController::class, 'editProduct'])->name(sb()->routeName('sb.dashboard.products.edit')); // @todo update
Route::get('/products/{product}/units', [ProductsController::class, 'productUnits'])->name(sb()->routeName('sb.dashboard.products.units'));
Route::get('/products/{product}/history', [ProductsController::class, 'productHistory'])->name(sb()->routeName('sb.dashboard.products.history'));
Route::get('/products/categories', [CategoryController::class, 'listCategories'])->name(sb()->routeName('sb.dashboard.products.categories'));
Route::get('/products/categories/create', [CategoryController::class, 'createCategory'])->name(sb()->routeName('sb.dashboard.products.categories.create'));
Route::get('/products/categories/edit/{category}', [CategoryController::class, 'editCategory'])->name(sb()->routeName('sb.dashboard.categories.edit'));
Route::get('/products/categories/compute-products/{category}', [CategoryController::class, 'computeCategoryProducts'])->name(sb()->routeName('sb.dashboard.products.categories.compute'));
Route::get('/products/stock-flow-records', [CategoryController::class, 'showStockFlowCrud'])->name(sb()->routeName('sb.dashboard.products.stock-flow-records'));
