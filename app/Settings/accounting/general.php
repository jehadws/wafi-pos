<?php

use App\Classes\FormInput;
use App\Crud\TransactionAccountCrud;

return [
  FormInput::multiselect(
    label: __('Expense Accounts'),
    name: 'sb_accounting_expenses_accounts',
    value: sb()->option->get('sb_accounting_expenses_accounts'),
    description: __('Assign accounts that are likely to be used for creating direct, scheduled or recurring expenses.'),
    options: $accounts['expenses'],
  ),
  FormInput::searchSelect(
    label: __('Paid Expense Offset'),
    name: 'sb_accounting_default_paid_expense_offset_account',
    value: sb()->option->get('sb_accounting_default_paid_expense_offset_account'),
    description: __('Assign the default account to be used as an offset account for paid expenses transactions.'),
    props: TransactionAccountCrud::getFormConfig(),
    component: 'sbCrudForm',
    options: $accounts['assets'],
  ),
];
