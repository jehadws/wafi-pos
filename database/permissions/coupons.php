<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $coupons = Permission::firstOrNew( [ 'namespace' => 'subul.create.coupons' ] );
    $coupons->name = __( 'Create Coupons' );
    $coupons->namespace = 'subul.create.coupons';
    $coupons->description = __( 'Let the user create coupons' );
    $coupons->save();

    $coupons = Permission::firstOrNew( [ 'namespace' => 'subul.delete.coupons' ] );
    $coupons->name = __( 'Delete Coupons' );
    $coupons->namespace = 'subul.delete.coupons';
    $coupons->description = __( 'Let the user delete coupons' );
    $coupons->save();

    $coupons = Permission::firstOrNew( [ 'namespace' => 'subul.update.coupons' ] );
    $coupons->name = __( 'Update Coupons' );
    $coupons->namespace = 'subul.update.coupons';
    $coupons->description = __( 'Let the user update coupons' );
    $coupons->save();

    $coupons = Permission::firstOrNew( [ 'namespace' => 'subul.read.coupons' ] );
    $coupons->name = __( 'Read Coupons' );
    $coupons->namespace = 'subul.read.coupons';
    $coupons->description = __( 'Let the user read coupons' );
    $coupons->save();
}
