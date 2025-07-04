<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $coupons = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.coupons' ] );
    $coupons->name = __( 'Create Coupons' );
    $coupons->namespace = 'jgrem.create.coupons';
    $coupons->description = __( 'Let the user create coupons' );
    $coupons->save();

    $coupons = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.coupons' ] );
    $coupons->name = __( 'Delete Coupons' );
    $coupons->namespace = 'jgrem.delete.coupons';
    $coupons->description = __( 'Let the user delete coupons' );
    $coupons->save();

    $coupons = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.coupons' ] );
    $coupons->name = __( 'Update Coupons' );
    $coupons->namespace = 'jgrem.update.coupons';
    $coupons->description = __( 'Let the user update coupons' );
    $coupons->save();

    $coupons = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.coupons' ] );
    $coupons->name = __( 'Read Coupons' );
    $coupons->namespace = 'jgrem.read.coupons';
    $coupons->description = __( 'Let the user read coupons' );
    $coupons->save();
}
