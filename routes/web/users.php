<?php

use App\Http\Controllers\Dashboard\UsersController;
use Illuminate\Support\Facades\Route;

Route::get('/users', [UsersController::class, 'listUsers'])->name('sb.dashboard.users');
Route::get('/users/create', [UsersController::class, 'createUser'])->name('sb.dashboard.users-create');
Route::get('/users/edit/{user}', [UsersController::class, 'editUser'])->name('sb.dashboard.users.edit');
Route::get('/users/{user}/orders', [UsersController::class, 'getUserOrders'])->name('sb.dashboard.users.orders');
Route::get('/users/{user}/rewards', [UsersController::class, 'getUserRewards'])->name('sb.dashboard.users.rewards');
Route::get('/users/{user}/coupons', [UsersController::class, 'getUserCoupons'])->name('sb.dashboard.users.coupons');
Route::get('/users/{user}/account-history', [UsersController::class, 'getUserAccountHistory'])->name('sb.dashboard.users.account-history');
Route::get('/users/roles/permissions-manager', [UsersController::class, 'permissionManager']);
Route::get('/users/profile', [UsersController::class, 'getProfile'])->name('sb.dashboard.users.profile');
Route::get('/users/roles', [UsersController::class, 'rolesList'])->name('sb.dashboard.users.roles');
Route::get('/users/roles/create', [UsersController::class, 'createRole'])->name('sb.dashboard.users.roles-create');
Route::get('/users/roles/edit/{role}', [UsersController::class, 'editRole'])->name('sb.dashboard.users.roles-edit');
