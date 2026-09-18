<?php

use App\Http\Controllers\Dashboard\RewardsSystemController;
use Illuminate\Support\Facades\Route;

Route::post('reward-system', [RewardsSystemController::class, 'create']);
Route::delete('reward-system/{id}', [RewardsSystemController::class, 'deleteRewardSystem']);
Route::put('reward-system/{id}', [RewardsSystemController::class, 'editRewardSystem']);
