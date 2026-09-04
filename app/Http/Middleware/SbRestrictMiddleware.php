<?php

namespace App\Http\Middleware;

use App\Exceptions\NotEnoughPermissionException;
use App\Traits\SbMiddlewareArgument;
use Closure;
use Illuminate\Http\Request;

class SbRestrictMiddleware
{
    use SbMiddlewareArgument;

    /**
     * Handle an incoming request.
     *
     * @return mixed
     */
    public function handle( Request $request, Closure $next, $permission )
    {
        if ( sb()->allowedTo( $permission ) ) {
            return $next( $request );
        }

        $message = sprintf(
            __( 'Your don\'t have enough permission ("%s") to perform this action.' ),
            $permission
        );

        throw new NotEnoughPermissionException( $message );
    }
}
