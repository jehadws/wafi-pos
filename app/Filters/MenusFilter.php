<?php

namespace App\Filters;

class MenusFilter
{
    public static function injectRegisterMenus( $menus )
    {
        if ( sb()->option->get( 'sb_subul_registers_enabled' ) === 'yes' ) {
            $menus = array_insert_after( $menus, 'pos', [
                'registers' => [
                    'label' => __( 'POS' ),
                    'icon' => 'la-cash-register',
                    'permissions' => [ 'subul.create.orders' ],
                    'childrens' => [
                        'pos' => [
                            'label' => __( 'Open POS' ),
                            'href' => sb()->route( 'sb.dashboard.pos' ),
                        ],
                        'create' => [
                            'label' => __( 'Create Register' ),
                            'permissions' => [ 'subul.create.registers' ],
                            'href' => sb()->route( 'sb.dashboard.registers-create' ),
                        ],
                        'list' => [
                            'label' => __( 'Registers List' ),
                            'permissions' => [ 'subul.create.registers' ],
                            'href' => sb()->route( 'sb.dashboard.registers-list' ),
                        ],
                    ],
                ],
            ] );

            unset( $menus[ 'pos' ] );
        }

        if ( sb()->option->get( 'sb_orders_allow_unpaid' ) === 'yes' && isset( $menus[ 'orders' ] ) ) {
            $menus = array_insert_after( $menus, 'orders', [
                'orders' => [
                    'label' => __( 'Orders' ),
                    'icon' => 'ListOrdered',
                    'childrens' => array_merge(
                        $menus[ 'orders' ][ 'childrens' ], [
                            'instalments' => [
                                'label' => __( 'Instalments' ),
                                'permissions' => [ 'subul.read.orders-instalments' ],
                                'href' => sb()->route( 'sb.dashboard.orders-instalments' ),
                            ],
                        ] ),
                ],
            ] );
        }

        return $menus;
    }
}
