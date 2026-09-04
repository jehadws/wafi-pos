<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $orders = Permission::firstOrNew( [ 'namespace' => 'subul.create.orders' ] );
    $orders->name = __( 'Create Orders' );
    $orders->namespace = 'subul.create.orders';
    $orders->description = __( 'Let the user create orders' );
    $orders->save();

    $orders = Permission::firstOrNew( [ 'namespace' => 'subul.delete.orders' ] );
    $orders->name = __( 'Delete Orders' );
    $orders->namespace = 'subul.delete.orders';
    $orders->description = __( 'Let the user delete orders' );
    $orders->save();

    $orders = Permission::firstOrNew( [ 'namespace' => 'subul.update.orders' ] );
    $orders->name = __( 'Update Orders' );
    $orders->namespace = 'subul.update.orders';
    $orders->description = __( 'Let the user update orders' );
    $orders->save();

    $orders = Permission::firstOrNew( [ 'namespace' => 'subul.read.orders' ] );
    $orders->name = __( 'Read Orders' );
    $orders->namespace = 'subul.read.orders';
    $orders->description = __( 'Let the user read orders' );
    $orders->save();

    $orders = Permission::firstOrNew( [ 'namespace' => 'subul.void.orders' ] );
    $orders->name = __( 'Void Order' );
    $orders->namespace = 'subul.void.orders';
    $orders->description = __( 'Let the user void orders' );
    $orders->save();

    $orders = Permission::firstOrNew( [ 'namespace' => 'subul.refund.orders' ] );
    $orders->name = __( 'Refund Order' );
    $orders->namespace = 'subul.refund.orders';
    $orders->description = __( 'Let the user refund orders' );
    $orders->save();

    $orders = Permission::firstOrNew( [ 'namespace' => 'subul.make-payment.orders' ] );
    $orders->name = __( 'Make Payment To orders' );
    $orders->namespace = 'subul.make-payment.orders';
    $orders->description = __( 'Allow the user to make payments to orders.' );
    $orders->save();
}
