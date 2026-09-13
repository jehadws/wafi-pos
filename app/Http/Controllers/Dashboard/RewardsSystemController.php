<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers\Dashboard;

use App\Crud\RewardSystemCrud;
use App\Http\Controllers\DashboardController;
use App\Models\Coupon;
use App\Models\RewardSystem;
use Inertia\Inertia;

class RewardsSystemController extends DashboardController
{
  /**
   * List reward systems
   *
   * @return \Inertia\Response
   */
  public function list()
  {
    /**
     * The single backend-driven list shell (T3.9): the reward systems
     * table renders from `RewardSystemCrud::table()` — the rule count
     * appended to the name and the author/coupon relations come from the
     * CRUD (`setActions()`/`getColumns()`), not from hand subqueries.
     */
    return RewardSystemCrud::table();
  }

  public function create()
  {
    $coupons = Coupon::get(['id', 'name']);
    return Inertia::render('dashboard/customers/rewards-system/create', [
      'title' => __('Rewards System'),
      'coupons' => $coupons,
    ]);
    // return RewardSystemCrud::form(
    //   config: [
    //     'view' => 'pages.dashboard.rewards-system.create',
    //   ]
    // );
  }

  public function edit(RewardSystem $reward)
  {
    $coupons = Coupon::get(['id', 'name']);
    $reward->rules;
    return Inertia::render('dashboard/customers/rewards-system/edit', [
      'title' => __('Rewards System'),
      'coupons' => $coupons,
      'reward' => $reward,
    ]);

    // return RewardSystemCrud::form(
    //   entry: $reward,
    //   config: [
    //     'view' => 'pages.dashboard.rewards-system.create',
    //   ]
    // );
  }
}
