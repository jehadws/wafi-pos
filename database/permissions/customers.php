<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $customers = Permission::firstOrNew( [ 'namespace' => 'subul.create.customers' ] );
    $customers->name = __( 'Create Customers' );
    $customers->namespace = 'subul.create.customers';
    $customers->description = __( 'Let the user create customers.' );
    $customers->save();

    $customers = Permission::firstOrNew( [ 'namespace' => 'subul.delete.customers' ] );
    $customers->name = __( 'Delete Customers' );
    $customers->namespace = 'subul.delete.customers';
    $customers->description = __( 'Let the user delete customers.' );
    $customers->save();

    $customers = Permission::firstOrNew( [ 'namespace' => 'subul.update.customers' ] );
    $customers->name = __( 'Update Customers' );
    $customers->namespace = 'subul.update.customers';
    $customers->description = __( 'Let the user update customers.' );
    $customers->save();

    $customers = Permission::firstOrNew( [ 'namespace' => 'subul.read.customers' ] );
    $customers->name = __( 'Read Customers' );
    $customers->namespace = 'subul.read.customers';
    $customers->description = __( 'Let the user read customers.' );
    $customers->save();

    $customers = Permission::firstOrNew( [ 'namespace' => 'subul.import.customers' ] );
    $customers->name = __( 'Import Customers' );
    $customers->namespace = 'subul.import.customers';
    $customers->description = __( 'Let the user import customers.' );
    $customers->save();

    $permission = Permission::firstOrNew( [ 'namespace' => 'subul.customers.manage-account-history' ] );
    $permission->namespace = 'subul.customers.manage-account-history';
    $permission->name = __( 'Manage Customer Account History' );
    $permission->description = __( 'Can add, deduct amount from each customers account.' );
    $permission->save();
}
