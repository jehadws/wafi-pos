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
use App\Models\RewardSystemRule;
use App\Models\User;
use Inertia\Inertia;

class RewardsSystemController extends DashboardController
{
  public function list()
  {
    $rewards = RewardSystem::select('*')
      ->addSelect([
        'author_name' => User::select('username')
          ->whereColumn('subul_users.id', 'author')
          ->limit(1),
        'coupon_name' => Coupon::select('name')
          ->whereColumn('subul_coupons.id', 'coupon_id')
          ->limit(1),
        'number_of_rules' => RewardSystemRule::selectRaw('COUNT(*)')
          ->whereColumn('reward_id', 'subul_rewards_system.id'),
      ])
      ->get();

    return Inertia::render('dashboard/customers/rewards-system/page', [
      'title' => __('Rewards System'),
      'rewards' => $rewards,
    ]);
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
