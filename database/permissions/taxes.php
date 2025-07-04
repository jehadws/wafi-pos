<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $taxes = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.taxes' ] );
    $taxes->name = __( 'Create Taxes' );
    $taxes->namespace = 'jgrem.create.taxes';
    $taxes->description = __( 'Let the user create taxes' );
    $taxes->save();

    $taxes = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.taxes' ] );
    $taxes->name = __( 'Delete Taxes' );
    $taxes->namespace = 'jgrem.delete.taxes';
    $taxes->description = __( 'Let the user delete taxes' );
    $taxes->save();

    $taxes = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.taxes' ] );
    $taxes->name = __( 'Update Taxes' );
    $taxes->namespace = 'jgrem.update.taxes';
    $taxes->description = __( 'Let the user update taxes' );
    $taxes->save();

    $taxes = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.taxes' ] );
    $taxes->name = __( 'Read Taxes' );
    $taxes->namespace = 'jgrem.read.taxes';
    $taxes->description = __( 'Let the user read taxes' );
    $taxes->save();
}
