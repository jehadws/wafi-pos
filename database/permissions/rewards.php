<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $reward = Permission::firstOrNew( [ 'namespace' => 'subul.create.rewards' ] );
    $reward->name = __( 'Create Rewards' );
    $reward->namespace = 'subul.create.rewards';
    $reward->description = __( 'Let the user create Rewards' );
    $reward->save();

    $reward = Permission::firstOrNew( [ 'namespace' => 'subul.delete.rewards' ] );
    $reward->name = __( 'Delete Rewards' );
    $reward->namespace = 'subul.delete.rewards';
    $reward->description = __( 'Let the user delete Rewards' );
    $reward->save();

    $reward = Permission::firstOrNew( [ 'namespace' => 'subul.update.rewards' ] );
    $reward->name = __( 'Update Rewards' );
    $reward->namespace = 'subul.update.rewards';
    $reward->description = __( 'Let the user update Rewards' );
    $reward->save();

    $reward = Permission::firstOrNew( [ 'namespace' => 'subul.read.rewards' ] );
    $reward->name = __( 'Read Rewards' );
    $reward->namespace = 'subul.read.rewards';
    $reward->description = __( 'Let the user read Rewards' );
    $reward->save();
}
