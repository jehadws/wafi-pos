<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $taxes = Permission::firstOrNew( [ 'namespace' => 'subul.create.taxes' ] );
    $taxes->name = __( 'Create Taxes' );
    $taxes->namespace = 'subul.create.taxes';
    $taxes->description = __( 'Let the user create taxes' );
    $taxes->save();

    $taxes = Permission::firstOrNew( [ 'namespace' => 'subul.delete.taxes' ] );
    $taxes->name = __( 'Delete Taxes' );
    $taxes->namespace = 'subul.delete.taxes';
    $taxes->description = __( 'Let the user delete taxes' );
    $taxes->save();

    $taxes = Permission::firstOrNew( [ 'namespace' => 'subul.update.taxes' ] );
    $taxes->name = __( 'Update Taxes' );
    $taxes->namespace = 'subul.update.taxes';
    $taxes->description = __( 'Let the user update taxes' );
    $taxes->save();

    $taxes = Permission::firstOrNew( [ 'namespace' => 'subul.read.taxes' ] );
    $taxes->name = __( 'Read Taxes' );
    $taxes->namespace = 'subul.read.taxes';
    $taxes->description = __( 'Let the user read taxes' );
    $taxes->save();
}
