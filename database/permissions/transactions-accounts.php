<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $transactionAccount = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.transactions-account' ] );
    $transactionAccount->name = __( 'Create Transaction Account' );
    $transactionAccount->namespace = 'jgrem.create.transactions-account';
    $transactionAccount->description = __( 'Let the user create transactions account' );
    $transactionAccount->save();

    $transactionAccount = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.transactions-account' ] );
    $transactionAccount->name = __( 'Delete Transactions Account' );
    $transactionAccount->namespace = 'jgrem.delete.transactions-account';
    $transactionAccount->description = __( 'Let the user delete Transaction Account' );
    $transactionAccount->save();

    $transactionAccount = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.transactions-account' ] );
    $transactionAccount->name = __( 'Update Transactions Account' );
    $transactionAccount->namespace = 'jgrem.update.transactions-account';
    $transactionAccount->description = __( 'Let the user update Transaction Account' );
    $transactionAccount->save();

    $transactionAccount = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.transactions-account' ] );
    $transactionAccount->name = __( 'Read Transactions Account' );
    $transactionAccount->namespace = 'jgrem.read.transactions-account';
    $transactionAccount->description = __( 'Let the user read Transaction Account' );
    $transactionAccount->save();
}
