<?php

namespace App\Http\Middleware;

use App\Services\Helper;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockDatabaseUpdateOnDesktopMiddleware
{
    /**
     * The shell runs migrations itself, before it opens the window, and backs
     * the database up first. The browser update page bypasses that order and
     * would run migrations against a live till without a snapshot.
     */
    public function handle( Request $request, Closure $next ): Response
    {
        if ( Helper::isDesktop() ) {
            abort( 403, __( 'Database updates are managed by the desktop application.' ) );
        }

        return $next( $request );
    }
}
