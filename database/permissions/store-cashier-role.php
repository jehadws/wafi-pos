<?php

use App\Models\Permission;
use App\Models\Role;
use App\Widgets\ProfileWidget;

$storeCashier = Role::firstOrNew( [ 'namespace' => 'subul.store.cashier' ] );
$storeCashier->name = __( 'Store Cashier' );
$storeCashier->namespace = 'subul.store.cashier';
$storeCashier->locked = true;
$storeCashier->description = __( 'Has a control over the sale process.' );
$storeCashier->save();
$storeCashier->addPermissions( [ 'read.dashboard' ] );
$storeCashier->addPermissions( Permission::includes( '.profile' )->get()->map( fn( $permission ) => $permission->namespace ) );
$storeCashier->addPermissions( Permission::whereIn( 'namespace', [
    'subul.create.orders',
    'subul.read.orders',
    'subul.update.orders',
    'subul.void.orders',
    'subul.refund.orders',
    'subul.make-payment.orders',
    'subul.create.orders-instaments',
    'subul.update.orders-instaments',
    'subul.read.orders-instaments',
    'subul.customers.manage-account-history',
] )->get()->map( fn( $permission ) => $permission->namespace ) );

$storeCashier->addPermissions( Permission::includes( '.pos' )->get()->map( fn( $permission ) => $permission->namespace ) );
$storeCashier->addPermissions( Permission::whereIn( 'namespace', [
    ( new ProfileWidget )->getPermission(),
] )->get()->map( fn( $permission ) => $permission->namespace ) );
