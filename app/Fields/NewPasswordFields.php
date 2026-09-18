<?php

namespace App\Fields;

use App\Classes\Hook;
use App\Services\FieldsService;

class NewPasswordFields extends FieldsService
{
    protected static $identifier = 'sb.new-password';

    public function get()
    {
        $fields = Hook::filter( 'sb-new-password-fields', [
            [
                'label' => __( 'Email' ),
                'description' => __( 'Your account email address.' ),
                'validation' => 'required|email',
                'name' => 'email',
                'type' => 'email',
                'disabled' => true,
            ], [
                'label' => __( 'New Password' ),
                'description' => __( 'define your new password.' ),
                'validation' => 'required|min:6',
                'name' => 'password',
                'type' => 'password',
            ],  [
                'label' => __( 'Confirm Password' ),
                'description' => __( 'confirm your new password.' ),
                'validation' => 'same:password',
                'name' => 'password_confirmation',
                'type' => 'password',
            ], [
                'name' => 'token',
                'type' => 'hidden',
            ],
        ] );

        return $fields;
    }
}
