<?php

use App\Http\Controllers\Dashboard\OrdersController;
use Illuminate\Support\Facades\Route;

Route::get('/orders', [OrdersController::class, 'listOrders'])->name(sb()->routeName('sb.dashboard.orders'));
Route::get('/orders/instalments', [OrdersController::class, 'listInstalments'])->name(sb()->routeName('sb.dashboard.orders-instalments'));
Route::get('/orders/payments-types', [OrdersController::class, 'listPaymentsTypes'])->name(sb()->routeName('sb.dashboard.orders-payments-types'));
Route::get('/orders/payments-types/create', [OrdersController::class, 'createPaymentType'])->name(sb()->routeName('sb.dashboard.orders-create-types'));
Route::get('/orders/payments-types/edit/{paymentType}', [OrdersController::class, 'updatePaymentType'])->name(sb()->routeName('sb.dashboard.orders-update-types'));
Route::get('/orders/invoice/{order}', [OrdersController::class, 'orderInvoice'])->name(sb()->routeName('sb.dashboard.orders-invoice'));
Route::get('/orders/receipt/{order}', [OrdersController::class, 'orderReceipt'])->name(sb()->routeName('sb.dashboard.orders-receipt'));
Route::get('/orders/refund-receipt/{refund}', [OrdersController::class, 'orderRefundReceipt'])->name(sb()->routeName('sb.dashboard.orders-refund-receipt'));
Route::get('/orders/payment-receipt/{orderPayment}', [OrdersController::class, 'getOrderPaymentReceipt'])->name(sb()->routeName('sb.dashboard.orders-payment-receipt'));
Route::get('/pos', [OrdersController::class, 'showPOS'])->name(sb()->routeName('sb.dashboard.pos'));
