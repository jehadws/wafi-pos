<?php

namespace App\Fields;

use App\Classes\FormInput;
use App\Classes\Hook;
use App\Models\TransactionAccount;
use App\Services\FieldsService;
use App\Services\Helper;

class CashRegisterCashingFields extends FieldsService
{
    protected static $identifier = 'sb.cash-registers-cashing';

    public function get()
    {
        $accounts = TransactionAccount::whereIn( 'id', sb()->option->get( 'sb_accounting_cashing_accounts', [] ) )->get();

        $fields = Hook::filter( 'sb-cash-register-cashing-fields', [
            FormInput::hidden(
                label: __( 'Amount' ),
                description: __( 'define the amount of the transaction.' ),
                name: 'amount',
            ),
            FormInput::searchSelect(
                label: __( 'Transaction Account' ),
                name: 'transaction_account_id',
                description: __( 'Select the account to proceed.' ),
                validation: 'required',
                value: sb()->option->get( 'sb_accounting_default_cashing_account' ),
                options: Helper::toJsOptions( $accounts, [ 'id', 'name' ] )
            ),
            FormInput::textarea(
                label: __( 'Description' ),
                description: __( 'Further observation while proceeding.' ),
                name: 'description',
            ),
        ] );

        return $fields;
    }
}
