<?php

use App\Http\Controllers\Dashboard\MediasController;
use App\Http\Middleware\NsRestrictMiddleware;
use Illuminate\Support\Facades\Route;

Route::get('medias', [MediasController::class, 'getMedias'])->middleware(NsRestrictMiddleware::arguments('jgrem.see.medias'));
Route::delete('medias/{id}', [MediasController::class, 'deleteMedia'])->middleware(NsRestrictMiddleware::arguments('jgrem.see.medias'));
Route::put('medias/{media}', [MediasController::class, 'updateMedia'])->middleware(NsRestrictMiddleware::arguments('jgrem.update.medias'));
Route::post('medias/bulk-delete/', [MediasController::class, 'bulkDeleteMedias'])->middleware(NsRestrictMiddleware::arguments('jgrem.delete.medias'));
Route::post('medias', [MediasController::class, 'uploadMedias'])->middleware(NsRestrictMiddleware::arguments('jgrem.upload.medias'));
