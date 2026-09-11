<?php

namespace App\Settings;

use App\Classes\SettingForm;
use App\Models\TransactionAccount;
use App\Services\Helper;
use App\Services\SettingsPage;

class AccountingSettings extends SettingsPage
{
  const IDENTIFIER = 'accounting';
  const VIEW = 'dashboard/settings/accounting';
  const AUTOLOAD = true;

  public function __construct()
  {
    $accounting = config('accounting');
    $accounts = collect($accounting['accounts'])->mapWithKeys(function ($account, $key) {
      return [$key => Helper::toJsOptions(TransactionAccount::where('category_identifier', $key)->where('sub_category_id', '!=', null)->get(), ['id', 'name'])];
    });

    $this->form = [
      'title' => __('Accounting'),
      'description' => __('Configure the accounting feature'),
      'tabs' => SettingForm::tabs(
        SettingForm::tab(
          identifier: 'general',
          label: __('General'),
          fields: include(dirname(__FILE__) . '/accounting/general.php'),
        ),
        SettingForm::tab(
          identifier: 'orders',
          label: __('Orders'),
          fields: include(dirname(__FILE__) . '/accounting/orders.php'),
        ),
      ),
    ];
  }

  public function getPayload()
  {
    return [
      'sb_accounting_expenses_accounts' => sb()->option->get('sb_accounting_expenses_accounts'),
      'sb_accounting_default_paid_expense_offset_account' => sb()->option->get('sb_accounting_default_paid_expense_offset_account'),
      'sb_accounting_orders_revenues_account' => sb()->option->get('sb_accounting_orders_revenues_account'),
      'sb_accounting_orders_cash_account' => sb()->option->get('sb_accounting_orders_cash_account'),
      'sb_accounting_orders_unpaid_account' => sb()->option->get('sb_accounting_orders_unpaid_account'),
      'sb_accounting_orders_cogs_account' => sb()->option->get('sb_accounting_orders_cogs_account'),
    ];
  }

  public function getOptions()
  {
    $accounting = config('accounting');
    $accounts = collect($accounting['accounts'])->mapWithKeys(function ($account, $key) {
      return [$key => Helper::toJsOptions(TransactionAccount::where('category_identifier', $key)->where('sub_category_id', '!=', null)->get(), ['id', 'name'])];
    });

    return [
      'sb_accounting_expenses_accounts' => $accounts['expenses'],
      'sb_accounting_default_paid_expense_offset_account' => $accounts['assets'],
      'sb_accounting_orders_revenues_account' => $accounts['revenues'],
      'sb_accounting_orders_cash_account' => $accounts['assets'],
      'sb_accounting_orders_unpaid_account' => $accounts['assets'],
      'sb_accounting_orders_cogs_account' => $accounts['expenses'],
    ];
  }
}
