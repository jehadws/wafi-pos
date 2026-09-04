<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $category = Permission::firstOrNew( [ 'namespace' => 'subul.create.categories' ] );
    $category->name = __( 'Create Categories' );
    $category->namespace = 'subul.create.categories';
    $category->description = __( 'Let the user create products categories.' );
    $category->save();

    $category = Permission::firstOrNew( [ 'namespace' => 'subul.delete.categories' ] );
    $category->name = __( 'Delete Categories' );
    $category->namespace = 'subul.delete.categories';
    $category->description = __( 'Let the user delete products categories.' );
    $category->save();

    $category = Permission::firstOrNew( [ 'namespace' => 'subul.update.categories' ] );
    $category->name = __( 'Update Categories' );
    $category->namespace = 'subul.update.categories';
    $category->description = __( 'Let the user update products categories.' );
    $category->save();

    $category = Permission::firstOrNew( [ 'namespace' => 'subul.read.categories' ] );
    $category->name = __( 'Read Categories' );
    $category->namespace = 'subul.read.categories';
    $category->description = __( 'Let the user read products categories.' );
    $category->save();
}
