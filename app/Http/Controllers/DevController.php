<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class DevController extends DashboardController
{
    public function index(): JsonResponse
    {
        if (!app()->environment('local', 'development', 'testing')) {
            abort(404);
        }

        return response()->json([
            'status' => 'ok',
            'environment' => app()->environment(),
            'debug' => config('app.debug'),
            'version' => config('app.version') ?? '1.0.0',
            'message' => 'Dev controller endpoint — local-only diagnostic surface.',
        ]);
    }
}
