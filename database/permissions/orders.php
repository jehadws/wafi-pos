<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $orders = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.orders' ] );
    $orders->name = __( 'Create Orders' );
    $orders->namespace = 'jgrem.create.orders';
    $orders->description = __( 'Let the user create orders' );
    $orders->save();

    $orders = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.orders' ] );
    $orders->name = __( 'Delete Orders' );
    $orders->namespace = 'jgrem.delete.orders';
    $orders->description = __( 'Let the user delete orders' );
    $orders->save();

    $orders = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.orders' ] );
    $orders->name = __( 'Update Orders' );
    $orders->namespace = 'jgrem.update.orders';
    $orders->description = __( 'Let the user update orders' );
    $orders->save();

    $orders = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.orders' ] );
    $orders->name = __( 'Read Orders' );
    $orders->namespace = 'jgrem.read.orders';
    $orders->description = __( 'Let the user read orders' );
    $orders->save();

    $orders = Permission::firstOrNew( [ 'namespace' => 'jgrem.void.orders' ] );
    $orders->name = __( 'Void Order' );
    $orders->namespace = 'jgrem.void.orders';
    $orders->description = __( 'Let the user void orders' );
    $orders->save();

    $orders = Permission::firstOrNew( [ 'namespace' => 'jgrem.refund.orders' ] );
    $orders->name = __( 'Refund Order' );
    $orders->namespace = 'jgrem.refund.orders';
    $orders->description = __( 'Let the user refund orders' );
    $orders->save();

    $orders = Permission::firstOrNew( [ 'namespace' => 'jgrem.make-payment.orders' ] );
    $orders->name = __( 'Make Payment To orders' );
    $orders->namespace = 'jgrem.make-payment.orders';
    $orders->description = __( 'Allow the user to make payments to orders.' );
    $orders->save();
}
