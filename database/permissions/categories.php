<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $category = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.categories' ] );
    $category->name = __( 'Create Categories' );
    $category->namespace = 'jgrem.create.categories';
    $category->description = __( 'Let the user create products categories.' );
    $category->save();

    $category = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.categories' ] );
    $category->name = __( 'Delete Categories' );
    $category->namespace = 'jgrem.delete.categories';
    $category->description = __( 'Let the user delete products categories.' );
    $category->save();

    $category = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.categories' ] );
    $category->name = __( 'Update Categories' );
    $category->namespace = 'jgrem.update.categories';
    $category->description = __( 'Let the user update products categories.' );
    $category->save();

    $category = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.categories' ] );
    $category->name = __( 'Read Categories' );
    $category->namespace = 'jgrem.read.categories';
    $category->description = __( 'Let the user read products categories.' );
    $category->save();
}
