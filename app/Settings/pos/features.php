<?php

use App\Models\Unit;
use App\Services\Helper;
use App\Services\OrdersService;

return [
    'label' => __( 'Features' ),
    'fields' => [
        [
            'name' => 'sb_subul_show_quantity',
            'value' => sb()->option->get( 'sb_subul_show_quantity' ),
            'label' => __( 'Show Quantity' ),
            'type' => 'switch',
            'options' => Helper::kvToJsOptions( [
                'yes' => __( 'Yes' ),
                'no' => __( 'No' ),
            ] ),
            'description' => __( 'Will show the quantity selector while choosing a product. Otherwise the default quantity is set to 1.' ),
        ], [
            'name' => 'sb_subul_items_merge',
            'value' => sb()->option->get( 'sb_subul_items_merge' ),
            'label' => __( 'Merge Similar Items' ),
            'type' => 'switch',
            'options' => Helper::kvToJsOptions( [
                'yes' => __( 'Yes' ),
                'no' => __( 'No' ),
            ] ),
            'description' => __( 'Will enforce similar products to be merged from the POS.' ),
        ], [
            'name' => 'sb_subul_allow_wholesale_price',
            'value' => sb()->option->get( 'sb_subul_allow_wholesale_price' ),
            'label' => __( 'Allow Wholesale Price' ),
            'type' => 'switch',
            'options' => Helper::kvToJsOptions( [
                'yes' => __( 'Yes' ),
                'no' => __( 'No' ),
            ] ),
            'description' => __( 'Define if the wholesale price can be selected on the POS.' ),
        ], [
            'name' => 'sb_subul_allow_decimal_quantities',
            'value' => sb()->option->get( 'sb_subul_allow_decimal_quantities' ),
            'label' => __( 'Allow Decimal Quantities' ),
            'type' => 'switch',
            'options' => Helper::kvToJsOptions( [
                'yes' => __( 'Yes' ),
                'no' => __( 'No' ),
            ] ),
            'description' => __( 'Will change the numeric keyboard for allowing decimal for quantities. Only for "default" numpad.' ),
        ], [
            'name' => 'sb_subul_quick_product',
            'value' => sb()->option->get( 'sb_subul_quick_product' ),
            'label' => __( 'Quick Product' ),
            'type' => 'switch',
            'options' => Helper::kvToJsOptions( [
                'yes' => __( 'Yes' ),
                'no' => __( 'No' ),
            ] ),
            'description' => __( 'Allow quick product to be created from the POS.' ),
        ], [
            'name' => 'sb_subul_quick_product_default_unit',
            'value' => sb()->option->get( 'sb_subul_quick_product_default_unit' ),
            'label' => __( 'Quick Product Default Unit' ),
            'type' => 'select',
            'options' => Helper::toJsOptions( Unit::get(), [ 'id', 'name' ] ),
            'description' => __( 'Set what unit is assigned by default to all quick product.' ),
        ], [
            'name' => 'sb_subul_unit_price_ediable',
            'value' => sb()->option->get( 'sb_subul_unit_price_ediable' ),
            'label' => __( 'Editable Unit Price' ),
            'type' => 'switch',
            'options' => Helper::kvToJsOptions( [
                'yes' => __( 'Yes' ),
                'no' => __( 'No' ),
            ] ),
            'description' => __( 'Allow product unit price to be edited.' ),
        ], [
            'name' => 'sb_subul_price_with_tax',
            'value' => sb()->option->get( 'sb_subul_price_with_tax' ),
            'label' => __( 'Show Price With Tax' ),
            'type' => 'switch',
            'options' => Helper::kvToJsOptions( [
                'yes' => __( 'Yes' ),
                'no' => __( 'No' ),
            ] ),
            'description' => __( 'Will display price with tax for each products.' ),
        ], [
            'name' => 'sb_subul_order_types',
            'value' => sb()->option->get( 'sb_subul_order_types' ),
            'label' => __( 'Order Types' ),
            'type' => 'multiselect',
            'options' => Helper::kvToJsOptions( app()->make( OrdersService::class )->getTypeLabels() ),
            'description' => __( 'Control the order type enabled.' ),
        ], [
            'name' => 'sb_subul_numpad',
            'value' => sb()->option->get( 'sb_subul_numpad' ),
            'label' => __( 'Numpad' ),
            'type' => 'switch',
            'options' => Helper::kvToJsOptions( [
                'default' => __( 'Default' ),
                'advanced' => __( 'Advanced' ),
            ] ),
            'description' => __( 'Will set what is the numpad used on the POS screen.' ),
        ], [
            'name' => 'sb_subul_force_autofocus',
            'value' => sb()->option->get( 'sb_subul_force_autofocus' ),
            'label' => __( 'Force Barcode Auto Focus' ),
            'type' => 'switch',
            'options' => Helper::kvToJsOptions( [
                'yes' => __( 'Yes' ),
                'no' => __( 'No' ),
            ] ),
            'description' => __( 'Will permanently enable barcode autofocus to ease using a barcode reader.' ),
        ],  [
            'name' => 'sb_subul_hide_exhausted_products',
            'value' => sb()->option->get( 'sb_subul_hide_exhausted_products' ),
            'label' => __( 'Hide Exhausted Products' ),
            'type' => 'switch',
            'options' => Helper::kvToJsOptions( [
                'yes' => __( 'Yes' ),
                'no' => __( 'No' ),
            ] ),
            'description' => __( 'Will hide exhausted products from selection on the POS.' ),
        ], [
            'name' => 'sb_subul_hide_empty_categories',
            'value' => sb()->option->get( 'sb_subul_hide_empty_categories' ),
            'label' => __( 'Hide Empty Category' ),
            'type' => 'switch',
            'options' => Helper::kvToJsOptions( [
                'yes' => __( 'Yes' ),
                'no' => __( 'No' ),
            ] ),
            'description' => __( 'Category with no or exhausted products will be hidden from selection.' ),
        ],
    ],
];
