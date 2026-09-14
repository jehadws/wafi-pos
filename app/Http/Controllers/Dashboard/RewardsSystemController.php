<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers\Dashboard;

use App\Crud\RewardSystemCrud;
use App\Http\Controllers\DashboardController;
use App\Models\RewardSystem;

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
    /**
     * The single backend-driven form shell (Phase 3): the reward system
     * create form renders from `RewardSystemCrud::form()` — the coupon
     * options travel inside the CRUD's own form config.
     */
    return RewardSystemCrud::form();
  }

  public function edit(RewardSystem $reward)
  {
    /**
     * Same generic form shell, pre-filled from the route-bound reward
     * system. The root-level `rules`/`ruleForm` passthrough (driving the
     * rules editor) travels inside `initialConfig.form` — same payload the
     * API fetch used to deliver, now inline.
     */
    return RewardSystemCrud::form(entry: $reward);
  }
}
