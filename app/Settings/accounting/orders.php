<?php

use App\Classes\FormInput;
use App\Classes\SettingForm;
use App\Crud\TransactionAccountCrud;

$props = TransactionAccountCrud::getFormConfig();

return SettingForm::fields(
    FormInput::searchSelect(
        label: __( 'Sales Revenues Account' ),
        name: 'sb_accounting_orders_revenues_account',
        value: sb()->option->get( 'sb_accounting_orders_revenues_account' ),
        description: __( 'Every order cash payment will be reflected on this account' ),
        component: 'sbCrudForm',
        props: $props,
        options: $accounts[ 'revenues' ],
    ),
    FormInput::searchSelect(
        label: __( 'Order Cash Account' ),
        name: 'sb_accounting_orders_cash_account',
        value: sb()->option->get( 'sb_accounting_orders_cash_account' ),
        description: __( 'Every order cash payment will be reflected on this account' ),
        component: 'sbCrudForm',
        props: $props,
        options: $accounts[ 'assets' ],
    ),
    FormInput::searchSelect(
        label: __( 'Receivable Account' ),
        name: 'sb_accounting_orders_unpaid_account',
        value: sb()->option->get( 'sb_accounting_orders_unpaid_account' ),
        description: __( 'Every unpaid orders will be recorded on this account.' ),
        component: 'sbCrudForm',
        props: $props,
        options: $accounts[ 'assets' ],
    ),
    FormInput::searchSelect(
        label: __( 'COGS Account' ),
        name: 'sb_accounting_orders_cogs_account',
        value: sb()->option->get( 'sb_accounting_orders_cogs_account' ),
        description: __( 'Cost of goods sold account' ),
        component: 'sbCrudForm',
        props: $props,
        options: $accounts[ 'expenses' ],
    ),
);
