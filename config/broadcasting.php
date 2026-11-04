<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Broadcaster
    |--------------------------------------------------------------------------
    |
    | This option controls the default broadcaster that will be used by the
    | framework when an event needs to be broadcast. You may set this to
    | any of the connections defined in the "connections" array below.
    |
    | Supported: "pusher", "redis", "log", "null"
    |
    */

    'default' => env( 'BROADCAST_DRIVER', 'null' ),

    /*
    |--------------------------------------------------------------------------
    | Broadcast Connections
    |--------------------------------------------------------------------------
    |
    | Here you may define all of the broadcast connections that will be used
    | to broadcast events to other systems or over websockets. Samples of
    | each available type of connection are provided inside this array.
    |
    */

    'connections' => [

        'pusher' => [
            'driver' => 'pusher',
            'key' => env( 'PUSHER_APP_KEY' ),
            'secret' => env( 'PUSHER_APP_SECRET' ),
            'app_id' => env( 'PUSHER_APP_ID' ),
            'options' => [
                'cluster' => env( 'PUSHER_APP_CLUSTER' ),
                'useTLS' => env( 'SB_SOCKET_SECURED', false ) ? true : false,
                'host' => env( 'SB_SOCKET_DOMAIN', env( 'SESSION_DOMAIN' ) ),
                'port' => env( 'SB_SOCKET_PORT', 6001 ),
                'scheme' => env( 'SB_SOCKET_SECURED', false ) ? 'https' : 'http',
                'encrypted' => env( 'SB_SOCKET_SECURED', false ) ? true : false,
                'curl_options' => [
                    CURLOPT_SSL_VERIFYHOST => false,
                    CURLOPT_SSL_VERIFYPEER => false,
                    CURLOPT_CAINFO => env( 'SB_SOCKET_CA', null ),
                ],
            ],
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],

        'log' => [
            'driver' => 'log',
        ],

        'null' => [
            'driver' => 'null',
        ],

    ],

];
