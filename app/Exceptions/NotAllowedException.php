<?php

namespace App\Exceptions;

use App\Classes\JsonResponse;
use App\Services\Helper;
use Exception;
use Inertia\Inertia;

class NotAllowedException extends Exception
{
    public function __construct( $message = null )
    {
        $this->message = $message ?: __( 'The Action You Tried To Perform Is Not Allowed.' );
    }

    public function getStatusCode()
    {
        return 403;
    }

    public function render( $request )
    {
        if ( ! $request->expectsJson() ) {
            return Inertia::render('errors/not-allowed', [
                'title' => __( 'Not Allowed Action' ),
                'message' => $this->getMessage(),
                'back' => Helper::getValidPreviousUrl( $request ),
            ])->toResponse($request)->setStatusCode($this->getStatusCode());
        }

        return JsonResponse::error(
            message: $this->getMessage() ?: __( 'The action you tried to perform is not allowed.' )
        );
    }
}
