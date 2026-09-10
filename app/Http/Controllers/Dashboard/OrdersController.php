<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers\Dashboard;

use App\Classes\Hook;
use App\Classes\Output;
use App\Crud\CustomerCrud;
use App\Crud\OrderCrud;
use App\Crud\OrderInstalmentCrud;
use App\Crud\PaymentTypeCrud;
use App\Events\OrderAfterPrintedEvent;
use App\Exceptions\NotAllowedException;
use App\Fields\OrderPaymentFields;
use App\Http\Controllers\DashboardController;
use App\Http\Requests\OrderPaymentRequest;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderInstalment;
use App\Models\OrderPayment;
use App\Models\OrderRefund;
use App\Models\PaymentType;
use App\Models\ProductCategory;
use App\Models\Register;
use App\Models\User;
use App\Services\DateService;
use App\Services\Options;
use App\Services\OrdersService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;

class OrdersController extends DashboardController
{
  private $paymentTypes;

  public function __construct(
    private OrdersService $ordersService,
    private Options $optionsService,
    protected DateService $dateService
  ) {
    $this->middleware(function ($request, $next) {
      /**
       * @todo must be refactored
       */
      $this->paymentTypes = PaymentType::orderBy('priority', 'asc')
        ->active()
        ->get()
        ->map(function ($payment, $index) {
          $payment->selected = $index === 0;

          return $payment;
        });

      return $next($request);
    });
  }

  public function create(Request $request)
  {
    return $this->ordersService->create($request->post());
  }

  public function updateOrder(Order $id, Request $request)
  {
    return $this->ordersService->create($request->post(), $id);
  }

  public function addProductToOrder($order_id, Request $request)
  {
    $order = $this->ordersService->getOrder($order_id);

    return $this->ordersService->addProducts($order, $request->input('products'));
  }

  public function getOrderPaymentReceipt(OrderPayment $orderPayment, Request $request)
  {
    $order = $orderPayment->order;
    $order->load('customer');
    $order->load('products');
    $order->load('shipping_address');
    $order->load('billing_address');
    $order->load('user');

    $orderPayment->load('order');

    return View::make('pages.dashboard.orders.templates.payment-receipt', [
      'payment' => $orderPayment,
      'order' => $order,
      'paymentTypes' => collect($this->paymentTypes)->mapWithKeys(function ($payment) {
        return [$payment['identifier'] => $payment['label']];
      }),
      'ordersService' => app()->make(OrdersService::class),
      'billing' => (new CustomerCrud)->getForm()['tabs']['billing']['fields'],
      'shipping' => (new CustomerCrud)->getForm()['tabs']['shipping']['fields'],
      'title' => sprintf(__('Payment Receipt &mdash; %s'), $order->code),
    ]);
  }

  public function listOrders()
  {
    Hook::addAction(
      'sb-crud-footer',
      fn(Output $output) => $output
        ->addView('pages.dashboard.orders.footer')
    );

    $customers = Customer::get(['id', 'first_name', 'last_name',]);
    $users = User::get(['id', 'username',]);
    $registers = Register::get(['id', 'name',]);
    return Inertia::render('dashboard/orders/page', [
      'title' => __('Orders List'),
      'description' => __('List of orders'),
      'customers' => $customers,
      'users' => $users,
      'registers' => $registers,
    ]);

    // return OrderCrud::table();
  }

  public function getPOSOrder($order_id)
  {
    return $this->ordersService->getOrder($order_id);
  }

  /**
   * get order products
   *
   * @param int order id
   * @return array or product
   */
  public function getOrderProducts($id)
  {
    return $this->ordersService->getOrderProducts($id);
  }

  public function getOrderPayments($id)
  {
    return $this->ordersService->getOrderPayments($id);
  }

  public function deleteOrderProduct($orderId, $productId)
  {
    $order = $this->ordersService->getOrder($orderId);

    return $this->ordersService->deleteOrderProduct($order, $productId);
  }

  public function getOrders(?Order $id = null)
  {
    if ($id instanceof Order) {
      $id->load('customer');
      $id->load('payments');
      $id->load('shipping_address');
      $id->load('billing_address');
      $id->load('products.unit');
      $id->load('refundedProducts.unit', 'refundedProducts.product', 'refundedProducts.orderProduct');

      return $id;
    }

    if (request()->query('limit')) {
      return Order::limit(request()->query('limit'))
        ->get();
    }

    return Order::with(['customer'])->AddSelect([
      'author_name' => User::select('username')->whereColumn('subul_users.id', 'author')->limit(1),
    ])->get();
  }

  public function showPOS()
  {
    /**
     * let's inject the necessary dependency
     * for being able to manage orders.
     */
    // Hook::addAction(
    //   'sb-dashboard-footer',
    //   fn(Output $output) => $output
    //     ->addView('pages.dashboard.orders.footer')
    // );

    $categories = ProductCategory::displayOnPOS()->get();
    return Inertia::render('dashboard/pos', [
      'title' => sprintf(
        __('POS'),
        sb()->option->get('sb_store_name', 'Subul')
      ),
      'orderTypes' => collect($this->ordersService->getTypeOptions())
        ->filter(function ($type, $label) {
          return in_array($label, sb()->option->get('sb_subul_order_types') ?: []);
        }),
      'options' => Hook::filter('sb-pos-options', [
        'sb_subul_printing_document' => sb()->option->get('sb_subul_printing_document', 'receipt'),
        // Defaults match the enforcement layer (OrdersService:968/973) and the
        // settings page display default ('yes') — a never-saved option must not
        // silently disable unpaid/partial orders at the POS.
        'sb_orders_allow_partial' => sb()->option->get('sb_orders_allow_partial', 'yes'),
        'sb_orders_allow_unpaid' => sb()->option->get('sb_orders_allow_unpaid', 'yes'),
        'sb_subul_order_types' => sb()->option->get('sb_subul_order_types', []),
        'sb_subul_quick_product' => sb()->option->get('sb_subul_quick_product', 'no'),
        'sb_subul_quick_product_default_unit' => sb()->option->get('sb_subul_quick_product_default_unit', 0),
        'sb_subul_price_with_tax' => sb()->option->get('sb_subul_price_with_tax', 'no'),
        // Default matches Options::setDefault() ('yes') — a never-saved option
        // must not silently lock unit-price editing at the POS.
        'sb_subul_unit_price_ediable' => sb()->option->get('sb_subul_unit_price_ediable', 'yes'),
        'sb_subul_printing_enabled_for' => sb()->option->get('sb_subul_printing_enabled_for', 'only_paid_orders'),
        'sb_subul_printing_auto' => sb()->option->get('sb_subul_printing_auto', 'yes'),
        'sb_subul_registers_enabled' => sb()->option->get('sb_subul_registers_enabled', 'no'),
        'sb_subul_idle_counter' => sb()->option->get('sb_subul_idle_counter', 0),
        'sb_subul_disbursement' => sb()->option->get('sb_subul_disbursement', 'no'),
        'sb_customers_default' => sb()->option->get('sb_customers_default', false),
        'sb_subul_vat' => sb()->option->get('sb_subul_vat', 'disabled'),
        'sb_subul_tax_group' => sb()->option->get('sb_subul_tax_group', null),
        'sb_subul_tax_type' => sb()->option->get('sb_subul_tax_type', false),
        'sb_subul_printing_gateway' => sb()->option->get('sb_subul_printing_gateway', 'default'),
        'sb_subul_show_quantity' => sb()->option->get('sb_subul_show_quantity', 'no') === 'no' ? false : true,
        'sb_subul_new_item_audio' => sb()->option->get('sb_subul_new_item_audio', ''),
        'sb_subul_complete_sale_audio' => sb()->option->get('sb_subul_complete_sale_audio', ''),
        'sb_subul_numpad' => sb()->option->get('sb_subul_numpad', 'default'),
        'sb_subul_allow_wholesale_price' => sb()->option->get('sb_subul_allow_wholesale_price', 'no') === 'yes' ? true : false,
        'sb_subul_allow_decimal_quantities' => sb()->option->get('sb_subul_allow_decimal_quantities', 'no') === 'yes' ? true : false,
        'sb_subul_force_autofocus' => sb()->option->get('sb_subul_force_autofocus', 'no') === 'yes' ? true : false,
        'sb_subul_items_merge' => sb()->option->get('sb_subul_items_merge', 'yes') === 'yes' ? true : false,
        'sb_subul_registers_default_change_payment_type' => sb()->option->get('sb_subul_registers_default_change_payment_type', 'cash'),
        'sb_orders_strict_instalments' => sb()->option->get('sb_orders_strict_instalments', 'no') === 'yes' ? true : false,
        'sb_customers_credit_enabled' => sb()->option->get('sb_customers_credit_enabled', 'no') === 'yes' ? true : false,
        // Customer constraints
        'sb_customers_rewards_enabled' => sb()->option->get('sb_customers_rewards_enabled', 'no') === 'yes' ? true : false,
        'sb_customers_force_valid_email' => sb()->option->get('sb_customers_force_valid_email', 'no'),
        'sb_customers_force_unique_phone' => sb()->option->get('sb_customers_force_unique_phone', 'no'),
        'sb_customers_default_group' => sb()->option->get('sb_customers_default_group', null),
        // Invoice / receipt settings
        'sb_invoice_receipt_template' => sb()->option->get('sb_invoice_receipt_template', 'default'),
        'sb_invoice_receipt_logo' => sb()->option->get('sb_invoice_receipt_logo', ''),
        'sb_invoice_receipt_footer' => sb()->option->get('sb_invoice_receipt_footer', ''),
        'sb_invoice_merge_similar_products' => sb()->option->get('sb_invoice_merge_similar_products', 'no') === 'yes' ? true : false,
        'sb_invoice_display_tax_breakdown' => sb()->option->get('sb_invoice_display_tax_breakdown', 'no') === 'yes' ? true : false,
        // Keyboard shortcuts
        'sb_subul_keyboard_cancel_order' => sb()->option->get('sb_subul_keyboard_cancel_order', []),
        'sb_subul_keyboard_hold_order' => sb()->option->get('sb_subul_keyboard_hold_order', []),
        'sb_subul_keyboard_create_customer' => sb()->option->get('sb_subul_keyboard_create_customer', []),
        'sb_subul_keyboard_payment' => sb()->option->get('sb_subul_keyboard_payment', []),
        'sb_subul_keyboard_shipping' => sb()->option->get('sb_subul_keyboard_shipping', []),
        'sb_subul_keyboard_note' => sb()->option->get('sb_subul_keyboard_note', []),
        'sb_subul_keyboard_order_type' => sb()->option->get('sb_subul_keyboard_order_type', []),
        'sb_subul_keyboard_fullscreen' => sb()->option->get('sb_subul_keyboard_fullscreen', []),
        'sb_subul_keyboard_quick_search' => sb()->option->get('sb_subul_keyboard_quick_search', []),
        'sb_subul_keyboard_toggle_merge' => sb()->option->get('sb_subul_keyboard_toggle_merge', []),
        // Amount shortcuts (quick payment buttons)
        'sb_subul_amount_shortcut' => sb()->option->get('sb_subul_amount_shortcut', null),
      ]),
      'urls' => [
        'sale_printing_url' => Hook::filter('sb-pos-printing-url', sb()->url('/dashboard/orders/receipt/{id}?dash-visibility=disabled&autoprint=true')),
        // 'orders_url' => sb()->route('sb.dashboard.orders'),
        // 'dashboard_url' => sb()->route('sb.dashboard.home'),
        // 'categories_url' => sb()->route('sb.dashboard.products.categories.create'),
        // 'registers_url' => sb()->route('sb.dashboard.registers-create'),
        // 'order_type_url' => sb()->route('sb.dashboard.settings', ['settings' => 'pos?tab=features']),
      ],
      'paymentTypes' => $this->paymentTypes,
      'categories' => $categories,
    ]);
  }

  public function orderInvoice(Order $order)
  {
    $optionsService = app()->make(Options::class);

    $order->load('customer');
    $order->load('products');
    $order->load('shipping_address');
    $order->load('billing_address');
    $order->load('user');
    $order->load('taxes');

    $order->products = Hook::filter('sb-receipt-products', $order->products);
    $order->paymentStatus = $this->ordersService->getPaymentLabel($order->payment_status);
    $order->deliveryStatus = $this->ordersService->getPaymentLabel($order->delivery_status);

    return Inertia::render('dashboard/orders/invoice/page', [
      'order' => $order,
      'options' => $optionsService->get(),
      'billing' => (new CustomerCrud)->getForm()['tabs']['billing']['fields'],
      'shipping' => (new CustomerCrud)->getForm()['tabs']['shipping']['fields'],
      'title' => sprintf(__('Order Invoice &mdash; %s'), $order->code),
    ]);
  }

  public function orderRefundReceipt(OrderRefund $refund)
  {
    $refund->load('order.customer', 'order.refundedProducts', 'order.refunds.author', 'order.shipping_address', 'order.billing_address', 'order.user');
    $refund->load('refunded_products.product', 'refunded_products.unit');

    $refund->refunded_products = Hook::filter('sb-refund-receipt-products', $refund->refunded_products);

    return View::make('pages.dashboard.orders.templates.refund-receipt', [
      'refund' => $refund,
      'ordersService' => app()->make(OrdersService::class),
      'billing' => (new CustomerCrud)->getForm()['tabs']['billing']['fields'],
      'shipping' => (new CustomerCrud)->getForm()['tabs']['shipping']['fields'],
      'title' => sprintf(__('Order Refund Receipt &mdash; %s'), $refund->order->code),
    ]);
  }

  public function orderReceipt(Order $order)
  {
    $order->load('customer');
    $order->load('products');
    $order->load('shipping_address');
    $order->load('billing_address');
    $order->load('user');
    $order->load('settings');
    $order->load('tax_group');

    return Inertia::render('dashboard/orders/receipt/page', [
      'order' => $order,
      'title' => sprintf(__('Order Receipt &mdash; %s'), $order->code),
      'optionsService' => $this->optionsService,
      'ordersService' => $this->ordersService,
      'paymentTypes' => collect($this->paymentTypes)->mapWithKeys(function ($payment) {
        return [$payment['identifier'] => $payment['label']];
      }),
    ]);
  }

  public function voidOrder(Order $order, Request $request)
  {
    return $this->ordersService->void($order, $request->input('reason'));
  }

  public function deleteOrder(Order $order)
  {
    return $this->ordersService->deleteOrder($order);
  }

  public function getSupportedPayments()
  {
    return (new OrderPaymentFields)->get();
  }

  /**
   * Will perform a payment on a specific order
   *
   * @param  Request $request
   * @return array
   */
  public function addPayment(Order $order, OrderPaymentRequest $request)
  {
    return $this->ordersService->makeOrderSinglePayment([
      'identifier' => $request->input('identifier'),
      'value' => $request->input('value'),
      'register_id' => $request->input('register_id'),
    ], $order);
  }

  public function makeOrderRefund(Order $order, Request $request)
  {
    return $this->ordersService->refundOrder($order, $request->all());
  }

  public function printOrder(Order $order, $doc = 'receipt')
  {
    OrderAfterPrintedEvent::dispatch($order, $doc);

    return [
      'status' => 'success',
      'message' => __('The printing event has been successfully dispatched.'),
    ];
  }

  public function listInstalments()
  {
    return Inertia::render('dashboard/orders/instalments/page', [
      'title' => __('Order Instalments'),
      'description' => __('List of all scheduled instalments across orders.'),
    ]);
  }

  public function getOrderInstalments(Order $order)
  {
    return $order->instalments;
  }

  public function updateInstalment(Order $order, OrderInstalment $instalment, Request $request)
  {
    return $this->ordersService->updateInstalment(
      $order,
      $instalment,
      $request->input('instalment')
    );
  }

  public function deleteInstalment(Order $order, OrderInstalment $instalment)
  {
    if ((int) $order->id !== (int) $instalment->order_id) {
      throw new NotAllowedException(__('There is a mismatch between the provided order and the order attached to the instalment.'));
    }

    return $this->ordersService->deleteInstalment($order, $instalment);
  }

  public function createInstalment(Order $order, Request $request)
  {
    return $this->ordersService->createInstalment($order, $request->input('instalment'));
  }

  public function markInstalmentAs(Order $order, OrderInstalment $instalment)
  {
    if ((int) $order->id !== (int) $instalment->order_id) {
      throw new NotAllowedException(__('There is a mismatch between the provided order and the order attached to the instalment.'));
    }

    return $this->ordersService->markInstalmentAsPaid($order, $instalment);
  }

  public function payInstalment(Order $order, OrderInstalment $instalment, Request $request)
  {
    if ((int) $order->id !== (int) $instalment->order_id) {
      throw new NotAllowedException(__('There is a mismatch between the provided order and the order attached to the instalment.'));
    }

    return $this->ordersService->markInstalmentAsPaid($order, $instalment, $request->input('payment_type'));
  }

  /**
   * Will change the order processing status
   *
   * @return string json response
   */
  public function changeOrderProcessingStatus(Request $request, Order $order)
  {
    return $this->ordersService->changeProcessingStatus($order, $request->input('process_status'));
  }

  /**
   * Will change the order processing status
   *
   * @return string json response
   */
  public function changeOrderDeliveryStatus(Request $request, Order $order)
  {
    return $this->ordersService->changeDeliveryStatus($order, $request->input('delivery_status'));
  }

  public function listPaymentsTypes()
  {
    $payments = PaymentType::all();
    return Inertia::render('dashboard/orders/payments-types/page', [
      'paymentTypes' => $payments,
    ]);

    // return PaymentTypeCrud::table();
  }

  public function createPaymentType()
  {

    return Inertia::render('dashboard/orders/payments-types/create');
    // return PaymentTypeCrud::form();
  }

  public function updatePaymentType(PaymentType $paymentType)
  {
    return inertia::render('dashboard/orders/payments-types/edit', [
      'paymentType' => $paymentType,
    ]);
    // return PaymentTypeCrud::form($paymentType);
  }

  public function getOrderProductsRefunded(Request $request, Order $order)
  {
    return $this->ordersService->getOrderRefundedProducts($order);
  }

  public function getOrderRefunds(Request $request, Order $order)
  {
    return $this->ordersService->getOrderRefunds($order);
  }
}
