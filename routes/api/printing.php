<?php

use App\Http\Controllers\Dashboard\PrintingController;
use Illuminate\Support\Facades\Route;

Route::get('printing/status', [ PrintingController::class, 'status' ]);
Route::get('printing/printers', [ PrintingController::class, 'printers' ]);
Route::get('printing/settings', [ PrintingController::class, 'settings' ]);
Route::put('printing/settings', [ PrintingController::class, 'saveSettings' ]);
Route::post('printing/test', [ PrintingController::class, 'test' ]);
Route::post('printing/receipt', [ PrintingController::class, 'receipt' ]);
Route::post('printing/labels', [ PrintingController::class, 'labels' ]);
Route::post('printing/labels/preview', [ PrintingController::class, 'labelPreview' ]);
Route::post('printing/drawer', [ PrintingController::class, 'drawer' ]);
