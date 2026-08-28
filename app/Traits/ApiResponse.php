<?php

namespace App\Traits;

trait ApiResponse
{
    /**
     * Return a standardised success response.
     *
     * @param  mixed   $data
     * @param  string  $message
     * @param  int     $status   HTTP status code (default 200)
     * @return \Illuminate\Http\JsonResponse
     */
    protected function success($data = null, string $message = '', int $status = 200)
    {
        return response()->json([
            'success' => true,
            'data'    => $data,
            'message' => $message,
        ], $status);
    }

    /**
     * Return a standardised error response.
     *
     * @param  string  $message
     * @param  int     $status   HTTP status code (default 400)
     * @param  mixed   $errors   Optional validation errors or extra detail
     * @return \Illuminate\Http\JsonResponse
     */
    protected function error(string $message, int $status = 400, $errors = null)
    {
        $payload = [
            'success' => false,
            'data'    => null,
            'message' => $message,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }
}
