<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $registers = Permission::firstOrNew( [ 'namespace' => 'subul.create.registers' ] );
    $registers->name = __( 'Create Registers' );
    $registers->namespace = 'subul.create.registers';
    $registers->description = __( 'Let the user create registers' );
    $registers->save();

    $registers = Permission::firstOrNew( [ 'namespace' => 'subul.delete.registers' ] );
    $registers->name = __( 'Delete Registers' );
    $registers->namespace = 'subul.delete.registers';
    $registers->description = __( 'Let the user delete registers' );
    $registers->save();

    $registers = Permission::firstOrNew( [ 'namespace' => 'subul.update.registers' ] );
    $registers->name = __( 'Update Registers' );
    $registers->namespace = 'subul.update.registers';
    $registers->description = __( 'Let the user update registers' );
    $registers->save();

    $registers = Permission::firstOrNew( [ 'namespace' => 'subul.read.registers' ] );
    $registers->name = __( 'Read Registers' );
    $registers->namespace = 'subul.read.registers';
    $registers->description = __( 'Let the user read registers' );
    $registers->save();

    $registers = Permission::firstOrNew( [ 'namespace' => 'subul.read.registers-history' ] );
    $registers->name = __( 'Read Registers History' );
    $registers->namespace = 'subul.read.registers-history';
    $registers->description = __( 'Let the user read registers history' );
    $registers->save();

    $registers = Permission::firstOrNew( [ 'namespace' => 'subul.use.registers' ] );
    $registers->name = __( 'Read Use Registers' );
    $registers->namespace = 'subul.use.registers';
    $registers->description = __( 'Let the user use registers' );
    $registers->save();
}
