<?php

use App\Http\Controllers\Dashboard\CashRegistersController;
use Illuminate\Support\Facades\Route;

Route::get( '/cash-registers', [ CashRegistersController::class, 'listRegisters' ] )->name( sb()->routeName( 'sb.dashboard.registers-list' ) ); // @todo update
Route::get( '/cash-registers/create', [ CashRegistersController::class, 'createRegister' ] )->name( sb()->routeName( 'sb.dashboard.registers-create' ) );
Route::get( '/cash-registers/edit/{register}', [ CashRegistersController::class, 'editRegister' ] )->name( sb()->routeName( 'sb.dashboard.registers-edit' ) );
Route::get( '/cash-registers/history/{register}', [ CashRegistersController::class, 'getRegisterHistory' ] )->name( sb()->routeName( 'sb.dashboard.registers-history' ) );
Route::get( '/cash-registers/z-report/{register}', [ CashRegistersController::class, 'getRegisterZReport' ] )->name( sb()->routeName( 'sb.dashboard.registers-zreport' ) );
