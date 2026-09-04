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
   * @return view
   */
  public function listTransactionsAccounts()
  {
    return Inertia::render('dashboard/accounting/accounts/page');
    // return TransactionAccountCrud::table();
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
