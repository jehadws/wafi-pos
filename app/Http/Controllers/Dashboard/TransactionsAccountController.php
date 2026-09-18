<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers\Dashboard;

use App\Crud\TransactionAccountCrud;
use App\Http\Controllers\DashboardController;
use App\Models\TransactionAccount;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;

class TransactionsAccountController extends DashboardController
{
  /**
   * List transactions accounts
   *
   * @return \Inertia\Response
   */
  public function listTransactionsAccounts()
  {
    /**
     * The single backend-driven list shell (T3.6): the transaction
     * accounts table renders from `TransactionAccountCrud::table()` —
     * columns, actions and links come from the CRUD config.
     */
    return TransactionAccountCrud::table();
  }

  /**
   *  Show transactions account form.
   *
   * @return view
   */
  public function createTransactionsAccounts()
  {
    /**
     * The single backend-driven form shell (Phase 3): the account create
     * form renders from `TransactionAccountCrud::form()` — the main-account
     * options are built inside `TransactionAccountCrud::getForm()`, so the
     * hand-built `category_identifiers` prop is gone.
     */
    return TransactionAccountCrud::form();
  }

  public function editTransactionsAccounts(TransactionAccount $account)
  {
    /**
     * Same generic form shell, pre-filled from the route-bound account
     * (sub-account options hydrate through the CRUD's refresh config).
     */
    return TransactionAccountCrud::form($account);
  }

  public function listTransactionsRules()
  {
    return Inertia::render('dashboard/accounting/rules/page', [
      'title' => __('Rules'),
      'description' => __('Manage transactions rules'),
    ]);
  }
}
