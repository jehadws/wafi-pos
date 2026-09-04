<?php

use App\Http\Controllers\Dashboard\CustomersController;
use App\Http\Controllers\Dashboard\CustomersGroupsController;
use App\Http\Middleware\SbRestrictMiddleware;
use Illuminate\Support\Facades\Route;

Route::delete('customers/{id}', [CustomersController::class, 'delete'])->middleware(SbRestrictMiddleware::arguments('subul.delete.customers'));
Route::delete('customers/using-email/{email}', [CustomersController::class, 'deleteUsingEmail'])->middleware(SbRestrictMiddleware::arguments('subul.delete.customers'));

Route::middleware(SbRestrictMiddleware::arguments('subul.read.customers'))->group(function () {
  Route::get('customers/{customer?}', [CustomersController::class, 'get'])->where(['customer' => '[0-9]+']);
  Route::get('customers/recently-active', [CustomersController::class, 'getRecentlyActive']);
  Route::get('customers/{customer}/orders', [CustomersController::class, 'getOrders']);
  Route::get('customers/{customer}/addresses', [CustomersController::class, 'getAddresses']);
  Route::get('customers/{customer}/group', [CustomersController::class, 'getGroup']);
  Route::get('customers/{customer}/coupons', [CustomersController::class, 'getCustomerCoupons']);
  Route::get('customers/{customer}/rewards', [CustomersController::class, 'getCustomerRewards']);
  Route::get('customers/{customer}/account-history', [CustomersController::class, 'getAccountHistory']);
});

Route::post('customers', [CustomersController::class, 'post'])->middleware(SbRestrictMiddleware::arguments('subul.create.customers'));
Route::post('customers/search', [CustomersController::class, 'searchCustomer'])->name(sb()->routeName('sb-api.customers.search'))->middleware(SbRestrictMiddleware::arguments('subul.read.customers'));
Route::post('customers/coupons/{coupon}', [CustomersController::class, 'loadCoupons'])->middleware(SbRestrictMiddleware::arguments('subul.read.customers'));
Route::post('customers/{customer}/crud/account-history', [CustomersController::class, 'recordAccountHistory'])->middleware(SbRestrictMiddleware::arguments('subul.customers.manage-account-history'));
Route::put('customers/{customer}', [CustomersController::class, 'put'])->middleware(SbRestrictMiddleware::arguments('subul.update.customers'));

Route::post('customers/{customer}/account-history', [CustomersController::class, 'accountTransaction'])->middleware(SbRestrictMiddleware::arguments('subul.customers.manage-account-history'));

Route::get('customers-groups/{id?}', [CustomersGroupsController::class, 'get'])->middleware(SbRestrictMiddleware::arguments('subul.read.customers-groups'));
Route::get('customers-groups/{id?}/customers', [CustomersGroupsController::class, 'getCustomers'])->middleware(SbRestrictMiddleware::arguments([
  'subul.read.customers-groups',
  'subul.read.customers',
]));
Route::delete('customers-groups/{id}', [CustomersGroupsController::class, 'delete'])->middleware(SbRestrictMiddleware::arguments('subul.delete.customers-groups'));
Route::post('customers-groups', [CustomersGroupsController::class, 'post'])->middleware(SbRestrictMiddleware::arguments('subul.create.customers-groups'));
Route::put('customers-groups/{id}', [CustomersGroupsController::class, 'put'])->middleware(SbRestrictMiddleware::arguments('subul.update.customers-groups'));
Route::post('customers-groups/transfer-customers', [CustomersGroupsController::class, 'transferOwnership'])->middleware(SbRestrictMiddleware::arguments([
  'subul.update.customers-groups',
  'subul.update.customers',
]));
