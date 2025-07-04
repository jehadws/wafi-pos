<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $providers = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.providers' ] );
    $providers->name = __( 'Create Providers' );
    $providers->namespace = 'jgrem.create.providers';
    $providers->description = __( 'Let the user create providers' );
    $providers->save();

    $providers = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.providers' ] );
    $providers->name = __( 'Delete Providers' );
    $providers->namespace = 'jgrem.delete.providers';
    $providers->description = __( 'Let the user delete providers' );
    $providers->save();

    $providers = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.providers' ] );
    $providers->name = __( 'Update Providers' );
    $providers->namespace = 'jgrem.update.providers';
    $providers->description = __( 'Let the user update providers' );
    $providers->save();

    $providers = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.providers' ] );
    $providers->name = __( 'Read Providers' );
    $providers->namespace = 'jgrem.read.providers';
    $providers->description = __( 'Let the user read providers' );
    $providers->save();
}
