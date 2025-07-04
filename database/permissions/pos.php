<?php

use App\Models\Permission;

if ( ! Permission::namespace( 'jgrem.pos.edit-purchase-price' ) instanceof Permission ) {
    $pos = Permission::firstOrNew( [ 'namespace' => 'jgrem.pos.edit-purchase-price' ] );
    $pos->name = __( 'Edit Purchase Price' );
    $pos->namespace = 'jgrem.pos.edit-purchase-price';
    $pos->description = __( 'Let the user edit the purchase price of products.' );
    $pos->save();
}

if ( ! Permission::namespace( 'jgrem.pos.edit-settings' ) instanceof Permission ) {
    $pos = Permission::firstOrNew( [ 'namespace' => 'jgrem.pos.edit-settings' ] );
    $pos->name = __( 'Edit Order Settings' );
    $pos->namespace = 'jgrem.pos.edit-settings';
    $pos->description = __( 'Let the user edit the order settings.' );
    $pos->save();
}

if ( ! Permission::namespace( 'jgrem.pos.products-discount' ) instanceof Permission ) {
    $pos = Permission::firstOrNew( [ 'namespace' => 'jgrem.pos.products-discount' ] );
    $pos->name = __( 'Edit Product Discounts' );
    $pos->namespace = 'jgrem.pos.products-discount';
    $pos->description = __( 'Let the user add discount on products.' );
    $pos->save();
}

if ( ! Permission::namespace( 'jgrem.pos.cart-discount' ) instanceof Permission ) {
    $pos = Permission::firstOrNew( [ 'namespace' => 'jgrem.pos.cart-discount' ] );
    $pos->name = __( 'Edit Cart Discounts' );
    $pos->namespace = 'jgrem.pos.cart-discount';
    $pos->description = __( 'Let the user add discount on cart.' );
    $pos->save();
}

if ( ! Permission::namespace( 'jgrem.pos.delete-order-product' ) instanceof Permission ) {
    $pos = Permission::firstOrNew( [ 'namespace' => 'jgrem.pos.delete-order-product' ] );
    $pos->name = __( 'POS: Delete Order Products' );
    $pos->namespace = 'jgrem.pos.delete-order-product';
    $pos->description = __( 'Let the user delete order products on POS.' );
    $pos->save();
}
