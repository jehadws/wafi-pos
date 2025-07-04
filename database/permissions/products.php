<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $product = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.products' ] );
    $product->name = __( 'Create Products' );
    $product->namespace = 'jgrem.create.products';
    $product->description = __( 'Let the user create products' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.products' ] );
    $product->name = __( 'Delete Products' );
    $product->namespace = 'jgrem.delete.products';
    $product->description = __( 'Let the user delete products' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.products' ] );
    $product->name = __( 'Update Products' );
    $product->namespace = 'jgrem.update.products';
    $product->description = __( 'Let the user update products' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.products' ] );
    $product->name = __( 'Read Products' );
    $product->namespace = 'jgrem.read.products';
    $product->description = __( 'Let the user read products' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'jgrem.convert.products-units' ] );
    $product->name = __( 'Convert Products Units' );
    $product->namespace = 'jgrem.convert.products-units';
    $product->description = __( 'Let the user convert products' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.products-history' ] );
    $product->name = __( 'Read Product History' );
    $product->namespace = 'jgrem.read.products-history';
    $product->description = __( 'Let the user read products history' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'jgrem.make.products-adjustments' ] );
    $product->name = __( 'Adjust Product Stock' );
    $product->namespace = 'jgrem.make.products-adjustments';
    $product->description = __( 'Let the user adjust product stock.' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.products-units' ] );
    $product->name = __( 'Create Product Units/Unit Group' );
    $product->namespace = 'jgrem.create.products-units';
    $product->description = __( 'Let the user create products units.' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.products-units' ] );
    $product->name = __( 'Read Product Units/Unit Group' );
    $product->namespace = 'jgrem.read.products-units';
    $product->description = __( 'Let the user read products units.' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.products-units' ] );
    $product->name = __( 'Update Product Units/Unit Group' );
    $product->namespace = 'jgrem.update.products-units';
    $product->description = __( 'Let the user update products units.' );
    $product->save();

    $product = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.products-units' ] );
    $product->name = __( 'Delete Product Units/Unit Group' );
    $product->namespace = 'jgrem.delete.products-units';
    $product->description = __( 'Let the user delete products units.' );
    $product->save();
}
