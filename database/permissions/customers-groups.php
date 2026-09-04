<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $customersGroups = Permission::firstOrNew( [ 'namespace' => 'subul.create.customers-groups' ] );
    $customersGroups->name = __( 'Create Customers Groups' );
    $customersGroups->namespace = 'subul.create.customers-groups';
    $customersGroups->description = __( 'Let the user create Customers Groups' );
    $customersGroups->save();

    $customersGroups = Permission::firstOrNew( [ 'namespace' => 'subul.delete.customers-groups' ] );
    $customersGroups->name = __( 'Delete Customers Groups' );
    $customersGroups->namespace = 'subul.delete.customers-groups';
    $customersGroups->description = __( 'Let the user delete Customers Groups' );
    $customersGroups->save();

    $customersGroups = Permission::firstOrNew( [ 'namespace' => 'subul.update.customers-groups' ] );
    $customersGroups->name = __( 'Update Customers Groups' );
    $customersGroups->namespace = 'subul.update.customers-groups';
    $customersGroups->description = __( 'Let the user update Customers Groups' );
    $customersGroups->save();

    $customersGroups = Permission::firstOrNew( [ 'namespace' => 'subul.read.customers-groups' ] );
    $customersGroups->name = __( 'Read Customers Groups' );
    $customersGroups->namespace = 'subul.read.customers-groups';
    $customersGroups->description = __( 'Let the user read Customers Groups' );
    $customersGroups->save();
}
