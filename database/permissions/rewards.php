<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $reward = Permission::firstOrNew( [ 'namespace' => 'jgrem.create.rewards' ] );
    $reward->name = __( 'Create Rewards' );
    $reward->namespace = 'jgrem.create.rewards';
    $reward->description = __( 'Let the user create Rewards' );
    $reward->save();

    $reward = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.rewards' ] );
    $reward->name = __( 'Delete Rewards' );
    $reward->namespace = 'jgrem.delete.rewards';
    $reward->description = __( 'Let the user delete Rewards' );
    $reward->save();

    $reward = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.rewards' ] );
    $reward->name = __( 'Update Rewards' );
    $reward->namespace = 'jgrem.update.rewards';
    $reward->description = __( 'Let the user update Rewards' );
    $reward->save();

    $reward = Permission::firstOrNew( [ 'namespace' => 'jgrem.read.rewards' ] );
    $reward->name = __( 'Read Rewards' );
    $reward->namespace = 'jgrem.read.rewards';
    $reward->description = __( 'Let the user read Rewards' );
    $reward->save();
}
