<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $procurements = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.procurements' ] );
    $procurements->name = __( 'Create Procurements' );
    $procurements->namespace = 'jgrem.create.procurements';
    $procurements->description = __( 'Let the user create procurements' );
    $procurements->save();

    $procurements = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.procurements' ] );
    $procurements->name = __( 'Delete Procurements' );
    $procurements->namespace = 'jgrem.delete.procurements';
    $procurements->description = __( 'Let the user delete procurements' );
    $procurements->save();

    $procurements = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.procurements' ] );
    $procurements->name = __( 'Update Procurements' );
    $procurements->namespace = 'jgrem.update.procurements';
    $procurements->description = __( 'Let the user update procurements' );
    $procurements->save();

    $procurements = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.procurements' ] );
    $procurements->name = __( 'Read Procurements' );
    $procurements->namespace = 'jgrem.read.procurements';
    $procurements->description = __( 'Let the user read procurements' );
    $procurements->save();
}
