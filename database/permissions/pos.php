<?php

use App\Models\Permission;

if ( ! Permission::namespace( 'subul.pos.edit-purchase-price' ) instanceof Permission ) {
    $pos = Permission::firstOrNew( [ 'namespace' => 'subul.pos.edit-purchase-price' ] );
    $pos->name = __( 'Edit Purchase Price' );
    $pos->namespace = 'subul.pos.edit-purchase-price';
    $pos->description = __( 'Let the user edit the purchase price of products.' );
    $pos->save();
}

if ( ! Permission::namespace( 'subul.pos.edit-settings' ) instanceof Permission ) {
    $pos = Permission::firstOrNew( [ 'namespace' => 'subul.pos.edit-settings' ] );
    $pos->name = __( 'Edit Order Settings' );
    $pos->namespace = 'subul.pos.edit-settings';
    $pos->description = __( 'Let the user edit the order settings.' );
    $pos->save();
}

if ( ! Permission::namespace( 'subul.pos.products-discount' ) instanceof Permission ) {
    $pos = Permission::firstOrNew( [ 'namespace' => 'subul.pos.products-discount' ] );
    $pos->name = __( 'Edit Product Discounts' );
    $pos->namespace = 'subul.pos.products-discount';
    $pos->description = __( 'Let the user add discount on products.' );
    $pos->save();
}

if ( ! Permission::namespace( 'subul.pos.cart-discount' ) instanceof Permission ) {
    $pos = Permission::firstOrNew( [ 'namespace' => 'subul.pos.cart-discount' ] );
    $pos->name = __( 'Edit Cart Discounts' );
    $pos->namespace = 'subul.pos.cart-discount';
    $pos->description = __( 'Let the user add discount on cart.' );
    $pos->save();
}

if ( ! Permission::namespace( 'subul.pos.delete-order-product' ) instanceof Permission ) {
    $pos = Permission::firstOrNew( [ 'namespace' => 'subul.pos.delete-order-product' ] );
    $pos->name = __( 'POS: Delete Order Products' );
    $pos->namespace = 'subul.pos.delete-order-product';
    $pos->description = __( 'Let the user delete order products on POS.' );
    $pos->save();
}
