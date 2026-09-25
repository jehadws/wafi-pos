<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers;

use App\Classes\Hook;
use App\Classes\Output;
use App\Models\Customer;
use App\Models\DashboardDay;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Services\DateService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
  public function __construct(
    protected DateService $dateService
  ) {
    // ...
  }

  public function home()
  {
    return Inertia::render('dashboard', [
      'title' => __('Dashboard'),
    ]);
    // return View::make('pages.dashboard.home', [
    //   'title' => __('Dashboard'),
    // ]);
  }

  public function getCards()
  {
    $todayStarts = $this->dateService->copy()->startOfDay()->toDateTimeString();
    $todayEnds = $this->dateService->copy()->endOfDay()->toDateTimeString();

    return DashboardDay::from($todayStarts)
      ->to($todayEnds)
      ->first() ?: [];
  }

  public function getBestCustomers()
  {
    return Customer::orderBy('purchases_amount', 'desc')->limit(5)->get();
  }

  public function getRecentsOrders()
  {
    return Order::orderBy('created_at', 'desc')->with('user')->limit(10)->get();
  }

  public function getBestCashiers()
  {
    $role = Role::namespace('subul.store.cashier');
    return $role
      ? $role->users()
          ->select('subul_users.id', 'subul_users.username', 'subul_users.email', 'subul_users.total_sales', 'subul_users.total_sales_count')
          ->orderBy('total_sales', 'desc')
          ->limit(10)
          ->get()
      : [];
  }

  /**
   * Will create a hook that will inject
   * Output object on the footer. Useful to create
   * custom output per page.
   *
   * @param  string $name
   * @return void
   */
  public function hookOutput($name)
  {
    Hook::addAction('sb-dashboard-footer', function (Output $output) use ($name) {
      Hook::action($name, $output);
    }, 15);
  }

  public function getWeekReports()
  {
    $weekMap = [
      0 => [
        'label' => __('Sunday'),
        'value' => 'SU',
      ],
      1 => [
        'label' => __('Monday'),
        'value' => 'MO',
      ],
      2 => [
        'label' => __('Tuesday'),
        'value' => 'TU',
      ],
      3 => [
        'label' => __('Wednesday'),
        'value' => 'WE',
      ],
      4 => [
        'label' => __('Thursday'),
        'value' => 'TH',
      ],
      5 => [
        'label' => __('Friday'),
        'value' => 'FR',
      ],
      6 => [
        'label' => __('Saturday'),
        'value' => 'SA',
      ],
    ];

    $currentWeekStarts = $this->dateService->copy()->startOfWeek();
    $currentWeekEnds = $this->dateService->copy()->endOfWeek();
    $lastWeekStarts = $currentWeekStarts->copy()->subDay()->startOfWeek();
    $lastWeekEnds = $currentWeekStarts->copy()->subDay()->endOfWeek();

    DashboardDay::from($currentWeekStarts->toDateTimeString())
      ->to($currentWeekEnds->toDateTimeString())
      ->get()
      ->each(function ($report) use (&$weekMap) {
        $dayIdx = Carbon::parse($report->range_starts)->dayOfWeek;
        if (!isset($weekMap[$dayIdx]['current']['entries'])) {
          $weekMap[$dayIdx]['current']['entries'] = [];
        }
        $report->setAttribute(
          'total_sales_amount',
          (float) ($report->day_paid_orders ?? 0)
            + (float) ($report->day_partially_paid_orders ?? 0)
            + (float) ($report->day_unpaid_orders ?? 0)
        );
        $weekMap[$dayIdx]['current']['entries'][] = $report;
      });

    DashboardDay::from($lastWeekStarts->toDateTimeString())
      ->to($lastWeekEnds->toDateTimeString())
      ->get()
      ->each(function ($report) use (&$weekMap) {
        $dayIdx = Carbon::parse($report->range_starts)->dayOfWeek;
        if (!isset($weekMap[$dayIdx]['previous']['entries'])) {
          $weekMap[$dayIdx]['previous']['entries'] = [];
        }
        $report->setAttribute(
          'total_sales_amount',
          (float) ($report->day_paid_orders ?? 0)
            + (float) ($report->day_partially_paid_orders ?? 0)
            + (float) ($report->day_unpaid_orders ?? 0)
        );
        $weekMap[$dayIdx]['previous']['entries'][] = $report;
      });

    return [
      'range_starts' => $lastWeekStarts->toDateTimeString(),
      'range_ends' => $currentWeekEnds->toDateTimeString(),
      'result' => $weekMap,
    ];
  }

  /**
   * Determines whether the currently authenticated user holds at least one
   * of the elevated roles that should see full financial & customer data.
   */
  private function isElevated(): bool
  {
    return sb()->hasRole(Role::ADMIN) || sb()->hasRole(Role::STOREADMIN);
  }

  public function getAllDashboardData()
  {
    $todayStarts = $this->dateService->copy()->startOfDay()->toDateTimeString();
    $todayEnds = $this->dateService->copy()->endOfDay()->toDateTimeString();

    $isElevated = $this->isElevated();
    $userId = Auth::id();

    // --- Stats cards ---
    // We compute today's summary fields directly with live DB queries for
    // accuracy (not cached DashboardDay which may lag behind the queue).
    // Cumulative fields (total_customers, total_products) are global counts.
    // Expenses come from the precomputed DashboardDay when available.
    $cards = null;
    if ($isElevated) {
      $todayReport = DashboardDay::from($todayStarts)->to($todayEnds)->first();

      // Match NexoPOS semantics: revenue counts paid & partially-paid orders
      // only (unpaid, voided and refunded orders are excluded).
      $todaySalesAmount = Order::from($todayStarts)
        ->to($todayEnds)
        ->whereIn('payment_status', [Order::PAYMENT_PAID, Order::PAYMENT_PARTIALLY])
        ->sum('total');

      $todayOrdersCount = Order::from($todayStarts)
        ->to($todayEnds)
        ->whereIn('payment_status', [Order::PAYMENT_PAID, Order::PAYMENT_PARTIALLY])
        ->count();

      $totalCustomers = Customer::count();
      $totalProducts = Product::count();

      $cards = [
        'total_sales_amount' => $todaySalesAmount,
        'total_orders'       => $todayOrdersCount,
        'total_customers'    => $totalCustomers,
        'total_products'     => $totalProducts,
        'day_expenses'       => $todayReport->day_expenses ?? 0,
      ];
    }

    // --- Best customers (admin/store-admin only) ---
    $bestCustomers = $isElevated
      ? Customer::orderBy('purchases_amount', 'desc')
          ->limit(5)
          ->get([
            'subul_users.id',
            'subul_users.username',
            'subul_users.first_name',
            'subul_users.last_name',
            'subul_users.email',
            'subul_users.purchases_amount',
          ])
          ->map(function ($customer) {
            $name = trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? ''));
            $customer->name = $name !== '' ? $name : $customer->username;
            return $customer;
          })
      : [];

    // --- Recent orders ---
    // Cashiers only see their own orders (author = current user id).
    $recentOrdersQuery = Order::orderBy('created_at', 'desc')
      ->with('user:id,username,first_name,last_name,email')
      ->limit(10);

    if (!$isElevated) {
      $recentOrdersQuery->where('author', $userId);
    }

    $recentOrders = $recentOrdersQuery->get([
      'id', 'code', 'total', 'payment_status', 'author', 'created_at',
    ]);

    // --- Best cashiers (admin/store-admin only) ---
    $cashierRole = Role::namespace(Role::STORECASHIER);
    $bestCashiers = $isElevated && $cashierRole
      ? $cashierRole->users()
          ->select('subul_users.id', 'subul_users.username', 'subul_users.email', 'subul_users.total_sales', 'subul_users.total_sales_count')
          ->orderBy('total_sales', 'desc')
          ->limit(10)
          ->get()
      : [];

    // --- Weekly chart (admin/store-admin only) ---
    $weeks = null;
    if ($isElevated) {
      $weeks = $this->getWeekReports();
    }

    return [
      'cards'         => $cards,
      'bestCustomers' => $bestCustomers,
      'recentOrders'  => $recentOrders,
      'bestCashiers'  => $bestCashiers,
      'weeks'         => $weeks,
      'isElevated'    => $isElevated,
    ];
  }
}
