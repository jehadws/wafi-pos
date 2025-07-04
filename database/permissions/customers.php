<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $customers = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.customers' ] );
    $customers->name = __( 'Create Customers' );
    $customers->namespace = 'jgrem.create.customers';
    $customers->description = __( 'Let the user create customers.' );
    $customers->save();

    $customers = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.customers' ] );
    $customers->name = __( 'Delete Customers' );
    $customers->namespace = 'jgrem.delete.customers';
    $customers->description = __( 'Let the user delete customers.' );
    $customers->save();

    $customers = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.customers' ] );
    $customers->name = __( 'Update Customers' );
    $customers->namespace = 'jgrem.update.customers';
    $customers->description = __( 'Let the user update customers.' );
    $customers->save();

    $customers = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.customers' ] );
    $customers->name = __( 'Read Customers' );
    $customers->namespace = 'jgrem.read.customers';
    $customers->description = __( 'Let the user read customers.' );
    $customers->save();

    $customers = Permission::firstOrNew( [ 'namespace' => 'jgrem.import.customers' ] );
    $customers->name = __( 'Import Customers' );
    $customers->namespace = 'jgrem.import.customers';
    $customers->description = __( 'Let the user import customers.' );
    $customers->save();

    $permission = Permission::firstOrNew( [ 'namespace' => 'jgrem.customers.manage-account-history' ] );
    $permission->namespace = 'jgrem.customers.manage-account-history';
    $permission->name = __( 'Manage Customer Account History' );
    $permission->description = __( 'Can add, deduct amount from each customers account.' );
    $permission->save();
}
