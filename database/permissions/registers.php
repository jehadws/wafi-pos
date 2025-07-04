<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $registers = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.registers' ] );
    $registers->name = __( 'Create Registers' );
    $registers->namespace = 'jgrem.create.registers';
    $registers->description = __( 'Let the user create registers' );
    $registers->save();

    $registers = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.registers' ] );
    $registers->name = __( 'Delete Registers' );
    $registers->namespace = 'jgrem.delete.registers';
    $registers->description = __( 'Let the user delete registers' );
    $registers->save();

    $registers = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.registers' ] );
    $registers->name = __( 'Update Registers' );
    $registers->namespace = 'jgrem.update.registers';
    $registers->description = __( 'Let the user update registers' );
    $registers->save();

    $registers = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.registers' ] );
    $registers->name = __( 'Read Registers' );
    $registers->namespace = 'jgrem.read.registers';
    $registers->description = __( 'Let the user read registers' );
    $registers->save();

    $registers = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.registers-history' ] );
    $registers->name = __( 'Read Registers History' );
    $registers->namespace = 'jgrem.read.registers-history';
    $registers->description = __( 'Let the user read registers history' );
    $registers->save();

    $registers = Permission::firstOrNew( [ 'namespace' => 'jgrem.use.registers' ] );
    $registers->name = __( 'Read Use Registers' );
    $registers->namespace = 'jgrem.use.registers';
    $registers->description = __( 'Let the user use registers' );
    $registers->save();
}
