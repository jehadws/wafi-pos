<?php

use App\Http\Controllers\Dashboard\ProvidersController;
use Illuminate\Support\Facades\Route;

Route::get('/providers', [ProvidersController::class, 'listproviders'])->name(sb()->routeName('sb.dashboard.providers'));
Route::get('/providers/create', [ProvidersController::class, 'createProvider'])->name(sb()->routeName('sb.dashboard.providers.create'));
Route::get('/providers/edit/{provider}', [ProvidersController::class, 'editProvider'])->name(sb()->routeName('sb.dashboard.providers.edit'));
Route::get('/providers/{provider}/procurements', [ProvidersController::class, 'listProvidersProcurements'])->name(sb()->routeName('sb.dashboard.providers.procurements'));
Route::get('/providers/{provider}/products', [ProvidersController::class, 'listProvidersProducts'])->name(sb()->routeName('sb.dashboard.providers.products'));
