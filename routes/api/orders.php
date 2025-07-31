<?php

use App\Http\Controllers\Dashboard\OrdersController;
use App\Http\Middleware\NsRestrictMiddleware;
use Illuminate\Support\Facades\Route;

Route::get('orders/{id?}', [OrdersController::class, 'getOrders'])->where('id', '[0-9]+');
Route::get('orders/payments', [OrdersController::class, 'getSupportedPayments']);
Route::get('orders/{id}/pos', [OrdersController::class, 'getPosOrder'])->where('id', '[0-9]+');
Route::get('orders/{id}/products', [OrdersController::class, 'getOrderProducts'])->where('id', '[0-9]+');
Route::get('orders/{order}/products/refunded', [OrdersController::class, 'getOrderProductsRefunded'])->where('order', '[0-9]+');
Route::get('orders/{order}/refunds', [OrdersController::class, 'getOrderRefunds'])->where('order', '[0-9]+');
Route::get('orders/{id}/payments', [OrdersController::class, 'getOrderPayments'])->where('id', '[0-9]+');
Route::get('orders/{order}/instalments', [OrdersController::class, 'getOrderInstalments'])->where('order', '[0-9]+')->middleware(NsRestrictMiddleware::arguments('jgrem.read.orders-instalments'));
Route::get('orders/{order}/print/{doc?}', [OrdersController::class, 'printOrder'])->where('order', '[0-9]+');
Route::post('orders/{order}/instalments/{instalment}/pay', [OrdersController::class, 'payInstalment'])->where('order', '[0-9]+')->middleware(NsRestrictMiddleware::arguments('jgrem.update.orders-instalments'));
Route::post('orders/{order}/void', [OrdersController::class, 'voidOrder'])->middleware(NsRestrictMiddleware::arguments('jgrem.void.orders'));
Route::post('orders', [OrdersController::class, 'create']);
Route::post('orders/{id}/products', [OrdersController::class, 'addProductToOrder']);
Route::post('orders/{order}/processing', [OrdersController::class, 'changeOrderProcessingStatus'])->middleware(NsRestrictMiddleware::arguments('jgrem.update.orders'));
Route::post('orders/{order}/delivery', [OrdersController::class, 'changeOrderDeliveryStatus'])->middleware(NsRestrictMiddleware::arguments('jgrem.update.orders'));
Route::post('orders/{order}/payments', [OrdersController::class, 'addPayment'])->middleware(NsRestrictMiddleware::arguments('jgrem.make-payment.orders'));
Route::post('orders/{order}/refund', [OrdersController::class, 'makeOrderRefund'])
  ->middleware(NsRestrictMiddleware::arguments('jgrem.refund.orders'));
Route::post('orders/{order}/instalments', [OrdersController::class, 'createInstalment'])->middleware(NsRestrictMiddleware::arguments('jgrem.create.orders-instalments'));

Route::put('orders/{order}/instalments/{instalment}', [OrdersController::class, 'updateInstalment'])->middleware(NsRestrictMiddleware::arguments('jgrem.update.orders-instalments'));
Route::put('orders/{id}', [OrdersController::class, 'updateOrder'])->middleware(NsRestrictMiddleware::arguments('jgrem.update.orders'));

Route::delete('orders/{order}/instalments/{instalment}', [OrdersController::class, 'deleteInstalment'])
  ->middleware(NsRestrictMiddleware::arguments('jgrem.delete.orders-instalments'));
Route::delete('orders/{order}', [OrdersController::class, 'deleteOrder'])->middleware(NsRestrictMiddleware::arguments('jgrem.delete.orders'));
Route::delete('orders/{id}/products/{product_id}', [OrdersController::class, 'deleteOrderProduct'])->where('id', '[0-9]+');
