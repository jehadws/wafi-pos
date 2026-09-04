<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LicenseMiddleware;
use App\Http\Middleware\LoadLangMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
  ->withRouting(
    web: __DIR__ . '/../routes/web.php',
    // api: __DIR__ . '/../routes/api.php',
    commands: __DIR__ . '/../routes/console.php',
    health: '/up',
  )
  ->withMiddleware(function (Middleware $middleware) {
    $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
    $middleware->validateCsrfTokens(except: ['api/setup/*']);

    $middleware->web(append: [
      \App\Http\Middleware\KillSessionIfNotInstalledMiddleware::class,
      HandleAppearance::class,
      LoadLangMiddleware::class,
      HandleInertiaRequests::class,
      AddLinkHeadersForPreloadedAssets::class,
      LicenseMiddleware::class,
    ]);
  })
  ->withExceptions(function (Exceptions $exceptions) {
    /**
     * For any request that expects JSON (all /api/* routes from Sanctum/axios),
     * return a standardised error envelope instead of a Laravel HTML error page.
     * This keeps the React frontend from parsing unexpected HTML responses.
     */
    $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
      if ($request->expectsJson()) {
        $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

        return response()->json([
          'success' => false,
          'data'    => null,
          'message' => $e->getMessage() ?: 'An unexpected error occurred.',
        ], $status);
      }
    });
  })->create();

