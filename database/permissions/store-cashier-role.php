<?php

use App\Models\Permission;
use App\Models\Role;
use App\Widgets\ProfileWidget;

$storeCashier = Role::firstOrNew( [ 'namespace' => 'jgrem.store.cashier' ] );
$storeCashier->name = __( 'Store Cashier' );
$storeCashier->namespace = 'jgrem.store.cashier';
$storeCashier->locked = true;
$storeCashier->description = __( 'Has a control over the sale process.' );
$storeCashier->save();
$storeCashier->addPermissions( [ 'read.dashboard' ] );
$storeCashier->addPermissions( Permission::includes( '.profile' )->get()->map( fn( $permission ) => $permission->namespace ) );
$storeCashier->addPermissions( Permission::whereIn( 'namespace', [
    'jgrem.create.orders',
    'jgrem.read.orders',
    'jgrem.update.orders',
    'jgrem.void.orders',
    'jgrem.refund.orders',
    'jgrem.make-payment.orders',
    'jgrem.create.orders-instaments',
    'jgrem.update.orders-instaments',
    'jgrem.read.orders-instaments',
    'jgrem.customers.manage-account-history',
] )->get()->map( fn( $permission ) => $permission->namespace ) );

$storeCashier->addPermissions( Permission::includes( '.pos' )->get()->map( fn( $permission ) => $permission->namespace ) );
$storeCashier->addPermissions( Permission::whereIn( 'namespace', [
    ( new ProfileWidget )->getPermission(),
] )->get()->map( fn( $permission ) => $permission->namespace ) );
