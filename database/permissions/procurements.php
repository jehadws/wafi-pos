<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $procurements = Permission::firstOrNew( [ 'namespace' => 'subul.create.procurements' ] );
    $procurements->name = __( 'Create Procurements' );
    $procurements->namespace = 'subul.create.procurements';
    $procurements->description = __( 'Let the user create procurements' );
    $procurements->save();

    $procurements = Permission::firstOrNew( [ 'namespace' => 'subul.delete.procurements' ] );
    $procurements->name = __( 'Delete Procurements' );
    $procurements->namespace = 'subul.delete.procurements';
    $procurements->description = __( 'Let the user delete procurements' );
    $procurements->save();

    $procurements = Permission::firstOrNew( [ 'namespace' => 'subul.update.procurements' ] );
    $procurements->name = __( 'Update Procurements' );
    $procurements->namespace = 'subul.update.procurements';
    $procurements->description = __( 'Let the user update procurements' );
    $procurements->save();

    $procurements = Permission::firstOrNew( [ 'namespace' => 'subul.read.procurements' ] );
    $procurements->name = __( 'Read Procurements' );
    $procurements->namespace = 'subul.read.procurements';
    $procurements->description = __( 'Let the user read procurements' );
    $procurements->save();
}
