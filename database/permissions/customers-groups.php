<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $customersGroups = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.customers-groups' ] );
    $customersGroups->name = __( 'Create Customers Groups' );
    $customersGroups->namespace = 'jgrem.create.customers-groups';
    $customersGroups->description = __( 'Let the user create Customers Groups' );
    $customersGroups->save();

    $customersGroups = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.customers-groups' ] );
    $customersGroups->name = __( 'Delete Customers Groups' );
    $customersGroups->namespace = 'jgrem.delete.customers-groups';
    $customersGroups->description = __( 'Let the user delete Customers Groups' );
    $customersGroups->save();

    $customersGroups = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.customers-groups' ] );
    $customersGroups->name = __( 'Update Customers Groups' );
    $customersGroups->namespace = 'jgrem.update.customers-groups';
    $customersGroups->description = __( 'Let the user update Customers Groups' );
    $customersGroups->save();

    $customersGroups = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.customers-groups' ] );
    $customersGroups->name = __( 'Read Customers Groups' );
    $customersGroups->namespace = 'jgrem.read.customers-groups';
    $customersGroups->description = __( 'Let the user read Customers Groups' );
    $customersGroups->save();
}
