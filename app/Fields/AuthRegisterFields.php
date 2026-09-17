<?php

namespace App\Fields;

use App\Classes\Hook;
use App\Services\FieldsService;

class AuthRegisterFields extends FieldsService
{
    protected static $identifier = 'sb.register';

    public function get()
    {
        $fields = Hook::filter( 'sb-register-fields', [
            [
                'label' => __( 'Username' ),
                'description' => __( 'Provide your username.' ),
                'validation' => 'required|min:5',
                'name' => 'username',
                'type' => 'text',
            ], [
                'label' => __( 'Email' ),
                'description' => __( 'Provide your email.' ),
                'validation' => 'required|email',
                'name' => 'email',
                'type' => 'text',
            ], [
                'label' => __( 'Password' ),
                'description' => __( 'Provide your password.' ),
                'validation' => 'required|min:6',
                'name' => 'password',
                'type' => 'password',
            ], [
                'label' => __( 'Confirm Password' ),
                'description' => __( 'Should be the same as the password.' ),
                'validation' => 'required|min:6|same:password',
                'name' => 'password_confirmation',
                'type' => 'password',
            ],
        ] );

        return $fields;
    }
}
