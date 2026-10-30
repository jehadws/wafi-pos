<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LicenseMiddleware;
use App\Http\Middleware\LoadLangMiddleware;
use App\Jobs\ClearHoldOrdersJob;
use App\Jobs\DetectLowStockProductsJob;
use App\Jobs\StockProcurementJob;
use Illuminate\Console\Scheduling\Schedule;
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
  ->withSchedule(function (Schedule $schedule) {
    /**
     * Hold orders (parked carts) are deleted once they exceed the
     * sb_orders_quotation_expiration setting.
     */
    $schedule->job(new ClearHoldOrdersJob)->daily();

    /**
     * Procurements that are "pending" with automatic approval
     * are stocked once their delivery time has occurred.
     */
    $schedule->job(new StockProcurementJob)->everyThirtyMinutes();

    /**
     * Notifies administrators about products whose
     * quantity went below the low quantity threshold.
     */
    $schedule->job(new DetectLowStockProductsJob)->daily();
  })
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
        $status = match (true) {
          $e instanceof \Illuminate\Auth\AuthenticationException => 401,
          $e instanceof \Illuminate\Validation\ValidationException => $e->status,
          $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface => $e->getStatusCode(),
          method_exists($e, 'getStatusCode') => $e->getStatusCode(),
          default => 500,
        };

        $payload = [
          'success' => false,
          'data'    => null,
          'message' => $e->getMessage() ?: 'An unexpected error occurred.',
        ];

        if ($e instanceof \Illuminate\Validation\ValidationException) {
          $payload['errors'] = $e->errors();
        }

        return response()->json($payload, $status);
      }
    });
  })->create();

if ($storagePath = env('LARAVEL_STORAGE_PATH')) {
  $app->useStoragePath($storagePath);
}

return $app;

