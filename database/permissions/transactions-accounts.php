<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $transactionAccount = Permission::firstOrNew( [ 'namespace' => 'subul.create.transactions-account' ] );
    $transactionAccount->name = __( 'Create Transaction Account' );
    $transactionAccount->namespace = 'subul.create.transactions-account';
    $transactionAccount->description = __( 'Let the user create transactions account' );
    $transactionAccount->save();

    $transactionAccount = Permission::firstOrNew( [ 'namespace' => 'subul.delete.transactions-account' ] );
    $transactionAccount->name = __( 'Delete Transactions Account' );
    $transactionAccount->namespace = 'subul.delete.transactions-account';
    $transactionAccount->description = __( 'Let the user delete Transaction Account' );
    $transactionAccount->save();

    $transactionAccount = Permission::firstOrNew( [ 'namespace' => 'subul.update.transactions-account' ] );
    $transactionAccount->name = __( 'Update Transactions Account' );
    $transactionAccount->namespace = 'subul.update.transactions-account';
    $transactionAccount->description = __( 'Let the user update Transaction Account' );
    $transactionAccount->save();

    $transactionAccount = Permission::firstOrNew( [ 'namespace' => 'subul.read.transactions-account' ] );
    $transactionAccount->name = __( 'Read Transactions Account' );
    $transactionAccount->namespace = 'subul.read.transactions-account';
    $transactionAccount->description = __( 'Let the user read Transaction Account' );
    $transactionAccount->save();
}
