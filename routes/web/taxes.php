<?php

use App\Http\Controllers\Dashboard\TaxesController;
use Illuminate\Support\Facades\Route;

Route::get('/taxes', [TaxesController::class, 'listTaxes'])->name(sb()->routeName('sb.dashboard.taxes'));
Route::get('/taxes/create', [TaxesController::class, 'createTax'])->name(sb()->routeName('sb.dashboard.taxes.create'));
Route::get('/taxes/edit/{tax}', [TaxesController::class, 'editTax'])->name(sb()->routeName('sb.dashboard.taxes.edit'));
Route::get('/taxes/groups', [TaxesController::class, 'taxesGroups'])->name(sb()->routeName('sb.dashboard.taxes.groups'));
Route::get('/taxes/groups/create', [TaxesController::class, 'createTaxGroups'])->name(sb()->routeName('sb.dashboard.taxes.groups.create'));
Route::get('/taxes/groups/edit/{group}', [TaxesController::class, 'editTaxGroup'])->name(sb()->routeName('sb.dashboard.taxes.groups.edit'));
