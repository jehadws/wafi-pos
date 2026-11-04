<?php

namespace App\Http\Middleware;

use App\Services\Helper;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class KillSetupWizardOnDesktopMiddleware
{
    /**
     * The desktop shell collects the first-run account itself. Leaving the
     * browser wizard reachable would let anyone on the machine reconfigure a
     * terminal that is already in use.
     */
    public function handle( Request $request, Closure $next ): Response
    {
        if ( Helper::isDesktop() ) {
            abort( 403, __( 'The setup wizard is not available in the desktop application.' ) );
        }

        return $next( $request );
    }
}
