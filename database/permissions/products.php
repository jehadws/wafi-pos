<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $product = Permission::firstOrNew( [ 'namespace' => 'subul.create.products' ] );
    $product->name = __( 'Create Products' );
    $product->namespace = 'subul.create.products';
    $product->description = __( 'Let the user create products' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'subul.delete.products' ] );
    $product->name = __( 'Delete Products' );
    $product->namespace = 'subul.delete.products';
    $product->description = __( 'Let the user delete products' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'subul.update.products' ] );
    $product->name = __( 'Update Products' );
    $product->namespace = 'subul.update.products';
    $product->description = __( 'Let the user update products' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'subul.read.products' ] );
    $product->name = __( 'Read Products' );
    $product->namespace = 'subul.read.products';
    $product->description = __( 'Let the user read products' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'subul.convert.products-units' ] );
    $product->name = __( 'Convert Products Units' );
    $product->namespace = 'subul.convert.products-units';
    $product->description = __( 'Let the user convert products' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'subul.read.products-history' ] );
    $product->name = __( 'Read Product History' );
    $product->namespace = 'subul.read.products-history';
    $product->description = __( 'Let the user read products history' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'subul.make.products-adjustments' ] );
    $product->name = __( 'Adjust Product Stock' );
    $product->namespace = 'subul.make.products-adjustments';
    $product->description = __( 'Let the user adjust product stock.' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'subul.create.products-units' ] );
    $product->name = __( 'Create Product Units/Unit Group' );
    $product->namespace = 'subul.create.products-units';
    $product->description = __( 'Let the user create products units.' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'subul.read.products-units' ] );
    $product->name = __( 'Read Product Units/Unit Group' );
    $product->namespace = 'subul.read.products-units';
    $product->description = __( 'Let the user read products units.' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'subul.update.products-units' ] );
    $product->name = __( 'Update Product Units/Unit Group' );
    $product->namespace = 'subul.update.products-units';
    $product->description = __( 'Let the user update products units.' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'subul.delete.products-units' ] );
    $product->name = __( 'Delete Product Units/Unit Group' );
    $product->namespace = 'subul.delete.products-units';
    $product->description = __( 'Let the user delete products units.' );
    $product->save();
}
