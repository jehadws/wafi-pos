<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $providers = Permission::firstOrNew( [ 'namespace' => 'subul.create.providers' ] );
    $providers->name = __( 'Create Providers' );
    $providers->namespace = 'subul.create.providers';
    $providers->description = __( 'Let the user create providers' );
    $providers->save();

    $providers = Permission::firstOrNew( [ 'namespace' => 'subul.delete.providers' ] );
    $providers->name = __( 'Delete Providers' );
    $providers->namespace = 'subul.delete.providers';
    $providers->description = __( 'Let the user delete providers' );
    $providers->save();

    $providers = Permission::firstOrNew( [ 'namespace' => 'subul.update.providers' ] );
    $providers->name = __( 'Update Providers' );
    $providers->namespace = 'subul.update.providers';
    $providers->description = __( 'Let the user update providers' );
    $providers->save();

    $providers = Permission::firstOrNew( [ 'namespace' => 'subul.read.providers' ] );
    $providers->name = __( 'Read Providers' );
    $providers->namespace = 'subul.read.providers';
    $providers->description = __( 'Let the user read providers' );
    $providers->save();
}
