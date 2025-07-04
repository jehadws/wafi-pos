<?php

use App\Models\Permission;

$permission = Permission::firstOrNew( [ 'namespace' => 'jgrem.manage-payments-types' ] );
$permission->namespace = 'jgrem.manage-payments-types';
$permission->name = __( 'Manage Order Payments' );
$permission->description = __( 'Allow to create, update and delete payments type.' );
$permission->save();
