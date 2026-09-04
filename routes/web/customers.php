<?php

use App\Http\Controllers\Dashboard\CustomersController;
use App\Http\Controllers\Dashboard\CustomersGroupsController;
use App\Http\Controllers\Dashboard\RewardsSystemController;
use Illuminate\Support\Facades\Route;

Route::get('/customers', [CustomersController::class, 'listCustomers'])->name(sb()->routeName('sb.dashboard.customers-list')); // @todo update
Route::get('/customers/create', [CustomersController::class, 'createCustomer'])->name(sb()->routeName('sb.dashboard.customers-create'));
Route::get('/customers/edit/{customer}', [CustomersController::class, 'editCustomer'])->name(sb()->routeName('sb.dashboard.customers-edit'));
Route::get('/customers/{customer}/rewards', [CustomersController::class, 'getCustomersRewards'])->name(sb()->routeName('sb.dashboard.customers-rewards-list')); // @todo update
Route::get('/customers/{customer}/rewards/edit/{reward}', [CustomersController::class, 'editCustomerReward'])->name(sb()->routeName('sb.dashboard.customers-rewards-edit'));
Route::get('/customers/{customer}/orders', [CustomersController::class, 'getCustomersOrders'])->name(sb()->routeName('sb.dashboard.customers-orders-list')); // @todo update
Route::get('/customers/{customer}/coupons', [CustomersController::class, 'getCustomersCoupons'])->name(sb()->routeName('sb.dashboard.customers-coupons-list'));
Route::get('/customers/{customer}/coupons/{customerCoupon}/history', [CustomersController::class, 'listCustomerCouponHistory'])->name(sb()->routeName('sb.dashboard.customers-coupons-history-list'));
Route::get('/customers/{customer}/account-history', [CustomersController::class, 'getCustomerAccountHistory'])->name(sb()->routeName('sb.dashboard.customers-account-history-list')); // @todo update
Route::get('/customers/{customer}/account-history/create', [CustomersController::class, 'createCustomerAccountHistory'])->name(sb()->routeName('sb.dashboard.customers-account-history-create'));
Route::get('/customers/{customer}/account-history/edit/{customerAccountHistory}', [CustomersController::class, 'editCustomerAccountHistory'])->name(sb()->routeName('sb.dashboard.customers-account-history-edit'));
Route::get('/customers/groups', [CustomersGroupsController::class, 'listCustomersGroups'])->name(sb()->routeName('sb.dashboard.customersgroups-list')); // @todo update
Route::get('/customers/groups/create', [CustomersGroupsController::class, 'createCustomerGroup'])->name(sb()->routeName('sb.dashboard.customersgroups-create'));
Route::get('/customers/groups/edit/{group}', [CustomersGroupsController::class, 'editCustomerGroup'])->name(sb()->routeName('sb.dashboard.customersgroups-edit'));
Route::get('/customers/rewards-system', [RewardsSystemController::class, 'list'])->name(sb()->routeName('sb.dashboard.rewards-list')); // @todo update
Route::get('/customers/rewards-system/create', [RewardsSystemController::class, 'create'])->name(sb()->routeName('sb.dashboard.rewards-create'));
Route::get('/customers/rewards-system/edit/{reward}', [RewardsSystemController::class, 'edit'])->name(sb()->routeName('sb.dashboard.rewards-edit'));
Route::get('/customers/coupons', [CustomersController::class, 'listCoupons'])->name(sb()->routeName('sb.dashboard.all-customers-coupons-list')); // @todo update
Route::get('/customers/coupons/create', [CustomersController::class, 'createCoupon'])->name(sb()->routeName('sb.dashboard.customers-coupons-create'));
Route::get('/customers/coupons/edit/{coupon}', [CustomersController::class, 'editCoupon'])->name(sb()->routeName('sb.dashboard.customers-coupons-edit'));
Route::get('/customers/coupons/history/{coupon}', [CustomersController::class, 'couponHistory'])->name(sb()->routeName('sb.dashboard.customers-coupons-history'));
Route::get('/customers/coupons-generated', [CustomersController::class, 'listGeneratedCoupons'])->name(sb()->routeName('sb.dashboard.customers-coupons-generated-list')); // @todo update
Route::get('/customers/coupons-generated/edit/{coupon}', [CustomersController::class, 'editGeneratedCoupon'])->name(sb()->routeName('sb.dashboard.customers-coupons-generated-edit'));
