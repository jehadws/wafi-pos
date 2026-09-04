<?php

use App\Http\Controllers\Dashboard\UnitsController;
use Illuminate\Support\Facades\Route;

Route::get('/units', [UnitsController::class, 'listUnits'])->name(sb()->routeName('sb.dashboard.units'));
Route::get('/units/edit/{unit}', [UnitsController::class, 'editUnit'])->name(sb()->routeName('sb.dashboard.units.edit'));
Route::get('/units/create', [UnitsController::class, 'createUnit'])->name(sb()->routeName('sb.dashboard.units.create'));
Route::get('/units/groups', [UnitsController::class, 'listUnitsGroups'])->name(sb()->routeName('sb.dashboard.units.groups'));
Route::get('/units/groups/create', [UnitsController::class, 'createUnitGroup'])->name(sb()->routeName('sb.dashboard.units.groups.create'));
Route::get('/units/groups/edit/{group}', [UnitsController::class, 'editUnitGroup'])->name(sb()->routeName('sb.dashboard.units.groups.edit'));
