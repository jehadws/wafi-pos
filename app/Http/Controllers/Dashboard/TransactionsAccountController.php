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
    $options = collect(config('accounting.accounts'))->map(fn($account, $key) => [
      'label' => $account['label'],
      'value' => $key,
    ])->values();
    return Inertia::render('dashboard/accounting/accounts/create', [
      'category_identifiers' => $options,
    ]);
    return TransactionAccountCrud::form();
  }

  public function editTransactionsAccounts(TransactionAccount $account)
  {
    $options = collect(config('accounting.accounts'))->map(fn($accountType, $key) => [
      'label' => $accountType['label'],
      'value' => $key,
    ])->values();

    return Inertia::render('dashboard/accounting/accounts/edit', [
      'category_identifiers' => $options,
      'transaction_account' => $account->toArray(),
    ]);
  }

  public function listTransactionsRules()
  {
    return Inertia::render('dashboard/accounting/rules/page', [
      'title' => __('Rules'),
      'description' => __('Manage transactions rules'),
    ]);
  }
}
