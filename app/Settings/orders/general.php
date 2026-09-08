<?php

use App\Classes\FormInput;
use App\Classes\SettingForm;
use App\Services\Helper;

$options = collect( [ 3, 5, 10, 15, 30 ] )->mapWithKeys( function ( $days ) {
    return [
        $days => sprintf( __( '%s Days' ), $days ),
    ];
} )->toArray();

$expirationOptions = Helper::kvToJsOptions( $options );

array_unshift( $expirationOptions, [
    'value' => 'never',
    'label' => __( 'Never' ),
] );

return SettingForm::tabs(
    SettingForm::tab(
        label: __( 'General' ),
        identifier: 'general',
        fields: SettingForm::fields(
            FormInput::select(
                label: __( 'Order Code Type' ),
                description: __( 'Determine how the system will generate code for each orders.' ),
                name: 'sb_orders_code_type',
                value: sb()->option->get( 'sb_orders_code_type' ),
                options: Helper::kvToJsOptions( [
                    'date_sequential' => __( 'Sequential' ),
                    'random_code' => __( 'Random Code' ),
                    'number_sequential' => __( 'Number Sequential' ),
                ] ),
            ),
            FormInput::switch(
                label: __( 'Allow Unpaid Orders' ),
                name: 'sb_orders_allow_unpaid',
                value: sb()->option->get( 'sb_orders_allow_unpaid' ),
                description: __( 'Will prevent incomplete orders to be placed. If credit is allowed, this option should be set to "yes".' ),
                options: Helper::kvToJsOptions( [
                    'yes' => __( 'Yes' ),
                    'no' => __( 'No' ),
                ] ),
            ),
            FormInput::switch(
                label: __( 'Allow Partial Orders' ),
                name: 'sb_orders_allow_partial',
                value: sb()->option->get( 'sb_orders_allow_partial' ),
                description: __( 'Will prevent partially paid orders to be placed.' ),
                options: Helper::kvToJsOptions( [
                    'yes' => __( 'Yes' ),
                    'no' => __( 'No' ),
                ] ),
            ),
            FormInput::switch(
                label: __( 'Strict Instalments' ),
                name: 'sb_orders_strict_instalments',
                value: sb()->option->get( 'sb_orders_strict_instalments' ),
                description: __( 'Will enforce instalment to be paid on specific date.' ),
                options: Helper::kvToJsOptions( [
                    'yes' => __( 'Yes' ),
                    'no' => __( 'No' ),
                ] ),
            ),
            FormInput::select(
                label: __( 'Hold Order Expiration' ),
                name: 'sb_orders_quotation_expiration',
                value: sb()->option->get( 'sb_orders_quotation_expiration' ),
                description: __( 'Hold orders older than the selected period will be cleared automatically.' ),
                options: $expirationOptions,
            ),
        )
    )
);
