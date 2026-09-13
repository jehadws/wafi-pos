<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers\Dashboard;

use App\Crud\CouponCrud;
use App\Crud\CouponOrderHistoryCrud;
use App\Crud\CustomerAccountCrud;
use App\Crud\CustomerCouponCrud;
use App\Crud\CustomerCouponHistoryCrud;
use App\Crud\CustomerCrud;
use App\Crud\CustomerOrderCrud;
use App\Crud\CustomerRewardCrud;
use App\Exceptions\NotFoundException;
use App\Http\Controllers\DashboardController;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\CustomerCoupon;
use App\Models\CustomerGroup;
use App\Models\CustomerReward;
use App\Models\Order;
use App\Services\CustomerService;
use App\Services\DateService;
use App\Services\OrdersService;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;

class CustomersController extends DashboardController
{
  public function __construct(
    protected CustomerService $customerService,
    protected OrdersService $ordersService,
    protected DateService $dateService
  ) {
    // ...
  }

  public function createCustomer()
  {
    $groups = CustomerGroup::get(['id', 'name']);
    return Inertia::render('dashboard/customers/create', [
      'title' => __('Dashboard'),
      'groups' => $groups
    ]);
    // return CustomerCrud::form();
  }

  /**
   * Shows the list of available customers under a CRUD
   * list
   *
   * @param void
   * @return backend vue
   */
  public function listCustomers()
  {
    /**
     * The single backend-driven list shell (T4.4): the customers table
     * renders from `CustomerCrud::table()` — the full action set (Edit,
     * Orders, Rewards, Coupons, Wallet History GOTOs + Delete) renders
     * from `$actions`, with every GOTO target resolving to an existing
     * route. `table()` enforces `allowedTo('read')` internally.
     */
    return CustomerCrud::table();
  }

  /**
   * Retreive few customers ordered by
   * their recent activity
   *
   * @return Collection
   */
  public function getRecentlyActive()
  {
    return $this->customerService->getRecentlyActive(10);
  }

  /**
   * get list of avialable customers
   *
   * @return json response
   */
  public function get($customer_id = null)
  {
    $customer = Customer::with([
      'group',
      'billing',
      'shipping',
    ])->find($customer_id);

    if ($customer_id !== null) {
      if ($customer instanceof Customer) {
        return $customer;
      }

      throw new NotFoundException(__('The requested customer cannot be found.'));
    }

    return $this->customerService->get();
  }

  /**
   * delete a customer
   *
   * @param int customer id
   * @return json
   */
  public function delete($id)
  {
    return $this->customerService->delete($id);
  }

  /**
   * create a customer using the provided
   * form request
   *
   * @param Request
   * @return json
   *
   * @todo implement security validation
   */
  public function post(Request $request)
  {
    $data = $request->only([
      'first_name',
      'last_name',
      'username',
      'password',
      'description',
      'gender',
      'phone',
      'email',
      'pobox',
      'group_id',
      'address',
    ]);

    return $this->customerService->create($data);
  }

  /**
   * edit a customer using provided
   * form request
   *
   * @param Request form data
   * @return json
   *
   * @todo implement a request for the validation
   */
  public function put($customer_id, Request $request)
  {
    $data = $request->only([
      'first_name',
      'last_name',
      'username',
      'password',
      'description',
      'gender',
      'phone',
      'email',
      'pobox',
      'group_id',
      'address',
    ]);

    return $this->customerService->update($customer_id, $data);
  }

  /**
   * Get specific customers order
   *
   * @param Customer entity
   * @return json
   */
  public function getOrders($id)
  {
    return $this->customerService->get($id)
      ->orders()
      ->orderBy('created_at', 'desc')
      ->get()
      ->map(function (Order $order) {
        $order->human_status = match ($order->payment_status) {
          Order::PAYMENT_HOLD => __('Hold'),
          Order::PAYMENT_PAID => __('Paid'),
          Order::PAYMENT_PARTIALLY => __('Partially Paid'),
          Order::PAYMENT_REFUNDED => __('Refunded'),
          Order::PAYMENT_UNPAID => __('Unpaid'),
          Order::PAYMENT_PARTIALLY_REFUNDED => __('Partially Refunded'),
          Order::PAYMENT_VOID => __('Void'),
          default => $order->payment_status,
        };

        $order->human_delivery_status = $this->ordersService->getDeliveryStatus($order->delivery_status);

        return $order;
      });
  }

  /**
   * Renders a form for editing a customer
   *
   * @return string
   */
  public function editCustomer(Customer $customer)
  {

    $groups = CustomerGroup::get(['id', 'name']);
    $customer->shipping;
    $customer->billing;
    return Inertia::render('dashboard/customers/edit', [
      'title' => __('Dashboard'),
      'groups' => $groups,
      'customer' => $customer
    ]);
    // return CustomerCrud::form($customer);
  }

  /**
   * get the address informations saved
   * under a specific customer id
   *
   * @param int customer id
   * @return array
   */
  public function getAddresses($id)
  {
    return $this->customerService->getCustomerAddresses($id);
  }

  /**
   * Deletes a customer using his email
   *
   * @param  string $email
   * @return array
   */
  public function deleteUsingEmail($email)
  {
    return $this->customerService->deleteUsingEmail($email);
  }

  public function listCoupons()
  {
    /**
     * The single backend-driven list shell (T4.3): the coupons table renders
     * from `CouponCrud::table()` — the History GOTO (its target
     * `couponHistory` already renders `CouponOrderHistoryCrud::table()`)
     * and the other actions render from `$actions` (replacing the hand
     * stub toast action, bug #4). `table()` enforces `allowedTo('read')`
     * internally.
     */
    return CouponCrud::table();
  }

  public function createCoupon()
  {
    return Inertia::render('dashboard/customers/coupons/create', [
      'title' => __('Create Coupon'),
      'description' => __('helps you creating a coupon.'),
    ]);
  }

  public function editCoupon(Coupon $coupon)
  {
    $coupon->categories;
    $coupon->products;
    $coupon->groups;

    return Inertia::render('dashboard/customers/coupons/edit', [
      'title' => __('Edit Coupon'),
      'description' => __('Editing an existing coupon.'),
      'coupon' => $coupon,
    ]);
  }

  public function searchCustomer(Request $request)
  {
    $search = $request->input('search');

    return $this->customerService->search($search);
  }

  public function accountTransaction(Customer $customer, Request $request)
  {
    $validation = Validator::make($request->all(), [
      'operation' => 'required',
      'amount' => 'required|integer',
    ]);

    if ($validation->fails()) {
      throw new Exception(__('Invalid Request.'));
    }

    return $this->customerService->saveTransaction(
      customer: $customer,
      operation: $request->input('operation'),
      amount: $request->input('amount'),
      description: $request->input('description'),
      details: [
        'author' => Auth::id(),
      ]
    );
  }

  public function getGroup(Customer $customer)
  {
    return $customer->group;
  }

  /**
   * Displays the orders placed by a specific customer
   *
   * The single backend-driven sub-list shell (T5.3): the customer's
   * orders render from `CustomerOrderCrud::table()` scoped by the
   * `customer_id` query param (the hook applies it). `table()`
   * enforces `allowedTo('read')` internally.
   *
   * @return \Inertia\Response
   */
  public function getCustomersOrders(Customer $customer)
  {
    return CustomerOrderCrud::table([
      'title' => sprintf(__('Orders by "%s"'), $customer->name),
      'queryParams' => [
        'customer_id' => $customer->id,
      ],
    ]);
  }

  /**
   * Displays the rewards earned by a specific customer
   *
   * The single backend-driven sub-list shell (T5.3), same pattern as
   * `getCustomersOrders`.
   *
   * @return \Inertia\Response
   */
  public function getCustomersRewards(Customer $customer)
  {
    return CustomerRewardCrud::table([
      'title' => sprintf(__('Rewards by "%s"'), $customer->name),
      'queryParams' => [
        'customer_id' => $customer->id,
      ],
    ]);
  }

  /**
   * Will render a formf or editing
   * a customer reward
   *
   * @return string
   */
  public function editCustomerReward(Customer $customer, CustomerReward $reward)
  {
    return CustomerRewardCrud::form($reward, [
      'returnUrl' => sb()->route('sb.dashboard.customers-rewards-list', ['customer' => $customer->id]),
      'queryParams' => [
        'customer_id' => $customer->id,
      ],
    ]);
  }

  /**
   * Displays the coupons claimed by a specific customer
   *
   * The single backend-driven sub-list shell (T5.3): the customer's
   * generated coupons render from `CustomerCouponCrud::table()` scoped
   * by the `customer_id` query param (the hook applies it). The
   * unscoped `/customers/coupons-generated` list renders the same CRUD
   * without the scope.
   *
   * @return \Inertia\Response
   */
  public function getCustomersCoupons(Customer $customer)
  {
    return CustomerCouponCrud::table([
      'title' => sprintf(__('Coupons by "%s"'), $customer->name),
      'queryParams' => [
        'customer_id' => $customer->id,
      ],
    ]);
  }

  /**
   * Returns allt he customer coupons
   *
   * @return array
   */
  public function getCustomerCoupons(Customer $customer)
  {
    return $customer->coupons()->with('coupon')->get();
  }

  /**
   * Loads specific customer coupon and return
   * as an array
   *
   * @param  string       $code
   * @return array|string
   */
  public function loadCoupons(Request $request, $code)
  {
    return $this->customerService->loadCoupon($code, $request->input('customer_id'));
  }

  /**
   * Displays the customer account history
   *
   * The single backend-driven sub-list shell (T5.3): the wallet
   * history renders from `CustomerAccountCrud::table()` scoped by the
   * `customer_id` query param (the hook applies it). The Add-New and
   * Edit flows resolve through `getLinks()`/`setActions()` and the
   * existing `/customers/{customer}/account-history/[create|edit/{id}]`
   * form routes.
   *
   * @return \Inertia\Response
   */
  public function getCustomerAccountHistory(Customer $customer)
  {
    return CustomerAccountCrud::table([
      'title' => sprintf(__('Account History : %s'), $customer->name),
      'queryParams' => [
        'customer_id' => $customer->id,
      ],
    ]);
  }

  /**
   * Will render a form to create a customer account history
   *
   * @return View
   */
  public function createCustomerAccountHistory(Customer $customer)
  {
    return CustomerAccountCrud::form(null, [
      'queryParams' => [
        'customer_id' => $customer->id,
      ],
      'returnUrl' => sb()->url('/dashboard/customers/' . $customer->id . '/account-history'),
      'submitUrl' => sb()->url('/api/customers/' . $customer->id . '/crud/account-history'),
      'description' => sprintf(
        __('Displays the customer account history for %s'),
        $customer->name
      ),
      'title' => sprintf(
        __('Account History : %s'),
        $customer->name
      ),
    ]);
  }

  public function recordAccountHistory(Customer $customer, Request $request)
  {
    return $this->customerService->saveTransaction(
      customer: $customer,
      operation: $request->input('general.operation'),
      amount: $request->input('general.amount'),
      description: $request->input('general.description'),
      details: [
        'author' => Auth::id(),
      ]
    );
  }

  /**
   * Will render a form for editing
   * a generated coupon
   *
   * @return View
   */
  public function editGeneratedCoupon(CustomerCoupon $coupon)
  {
    return CustomerCouponCrud::form($coupon);
  }

  /**
   * Will list all coupons generated
   * for the available customer
   *
   * @return View
   */
  public function listGeneratedCoupons()
  {
    return CustomerCouponCrud::table();
  }

  /**
   * Will return the customer rewards
   *
   * @return array<CustomerReward> $customerRewards
   */
  public function getCustomerRewards(Customer $customer)
  {
    return $customer->rewards()->paginate(20);
  }

  /**
   * Will return the customer account history
   *
   * @return array
   */
  public function getAccountHistory(Customer $customer)
  {
    return $customer
      ->account_history()
      ->orderBy('created_at', 'desc')
      ->paginate(20);
  }

  public function couponHistory(Coupon $coupon)
  {
    return CouponOrderHistoryCrud::table([
      'queryParams' => [
        'coupon_id' => $coupon->id,
      ],
    ]);
  }

  public function listCustomerCouponHistory(Customer $customer, CustomerCoupon $customerCoupon)
  {
    return CustomerCouponHistoryCrud::table(
      title: sprintf(__('%s Coupon History'), $customer->name),
      queryParams: [
        'customer_id' => $customer->id,
        'customer_coupon_id' => $customerCoupon->id,
      ]
    );
  }
}
