<?php

namespace App\Fields;

use App\Classes\Hook;
use App\Services\FieldsService;

class ConfirmPasswordFields extends FieldsService
{
    protected static $identifier = 'sb.confirm-password';

    public function get()
    {
        $fields = Hook::filter( 'sb-confirm-password-fields', [
            [
                'label' => __( 'Confirm Password' ),
                'description' => __( 'Please confirm your password before continuing.' ),
                'validation' => 'required|string|current_password:web',
                'name' => 'password',
                'type' => 'password',
            ],
        ] );

        return $fields;
    }
}
