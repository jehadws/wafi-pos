<?php

use App\Models\TaxGroup;
use App\Services\Helper;

$fields = [
    [
        'label' => __( 'VAT Type' ),
        'name' => 'sb_subul_vat',
        'type' => 'select',
        'value' => sb()->option->get( 'sb_subul_vat' ),
        'description' => __( 'Determine the VAT type that should be used.' ),
        'options' => Helper::kvToJsOptions( [
            'disabled' => __( 'Disabled' ),
            'flat_vat' => __( 'Flat Rate' ),
            'variable_vat' => __( 'Flexible Rate' ),
            'products_vat' => __( 'Products Vat' ),
        ] ),
    ],
];

if ( in_array( sb()->option->get( 'sb_subul_vat' ), [ 'flat_vat' ] ) ) {
    $fields[] = [
        'type' => 'select',
        'name' => 'sb_subul_tax_group',
        'value' => sb()->option->get( 'sb_subul_tax_group' ),
        'options' => Helper::toJsOptions( TaxGroup::get(), [ 'id', 'name' ] ),
        'label' => __( 'Tax Group' ),
        'description' => __( 'Define the tax group that applies to the sales.' ),
    ];

    $fields[] = [
        'type' => 'select',
        'name' => 'sb_subul_tax_type',
        'value' => sb()->option->get( 'sb_subul_tax_type' ),
        'options' => Helper::kvToJsOptions( [
            'inclusive' => __( 'Inclusive' ),
            'exclusive' => __( 'Exclusive' ),
        ] ),
        'label' => __( 'Tax Type' ),
        'description' => __( 'Define how the tax is computed on sales.' ),
    ];
}

return [
    'label' => __( 'VAT Settings' ),
    'fields' => $fields,
];
