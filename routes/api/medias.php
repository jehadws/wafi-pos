<?php

use App\Http\Controllers\Dashboard\MediasController;
use App\Http\Middleware\SbRestrictMiddleware;
use Illuminate\Support\Facades\Route;

Route::get('medias', [MediasController::class, 'getMedias'])->middleware(SbRestrictMiddleware::arguments('subul.see.medias'));
Route::delete('medias/{id}', [MediasController::class, 'deleteMedia'])->middleware(SbRestrictMiddleware::arguments('subul.see.medias'));
Route::put('medias/{media}', [MediasController::class, 'updateMedia'])->middleware(SbRestrictMiddleware::arguments('subul.update.medias'));
Route::post('medias/bulk-delete/', [MediasController::class, 'bulkDeleteMedias'])->middleware(SbRestrictMiddleware::arguments('subul.delete.medias'));
Route::post('medias', [MediasController::class, 'uploadMedias'])->middleware(SbRestrictMiddleware::arguments('subul.upload.medias'));
