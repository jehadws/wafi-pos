<?php

namespace App\Http\Middleware;

use App\Models\License;
use App\Services\HwidService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class LicenseMiddleware
{
    /**
     * Cache duration in seconds (5 seconds to prevent spamming across parallel sub-requests).
     * Keeping this short ensures database modifications take effect immediately.
     */
    public const CACHE_TTL_SECONDS = 5;

    /**
     * Handle incoming request and enforce offline HWID licensing policy.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Bypass licensing for setup, authentication, activation, and static asset routes
        if ($this->shouldBypass($request)) {
            return $next($request);
        }

        // Bypass in testing environment
        if (app()->runningUnitTests()) {
            return $next($request);
        }

        // If the system is not yet installed, allow the setup wizard to proceed
        if (class_exists(\App\Services\Helper::class) && !\App\Services\Helper::installed()) {
            return $next($request);
        }

        // Do NOT redirect unauthenticated users to /activate.
        // The Authenticate middleware will handle the login redirect first.
        // This ensures the flow is: dashboard → login → activate (if needed).
        if (!auth()->check()) {
            return $next($request);
        }

        $hwid = HwidService::generate();

        $cacheKey = "license_{$hwid}";
        $licenseData = Cache::get($cacheKey);

        if ($licenseData === null) {
            $license = License::where('hwid', $hwid)
                ->where('is_active', true)
                ->first();

            if ($license && $license->isValid()) {
                // Throttle last_seen database writes to at most once every 15 minutes
                if ($license->last_seen === null || $license->last_seen->diffInMinutes(now()) >= 15) {
                    $license->withoutEvents(function () use ($license) {
                        $license->update(['last_seen' => now()]);
                    });
                }

                $licenseData = [
                    'is_valid'     => true,
                    'device_name'  => $license->device_name,
                    'activated_at' => $license->activated_at?->toIso8601String(),
                    'last_seen'    => $license->last_seen?->toIso8601String(),
                ];
                // Cache valid license for 24 hours (LAN grace period)
                Cache::put($cacheKey, $licenseData, self::CACHE_TTL_SECONDS);
            } else {
                $licenseData = [
                    'is_valid'     => false,
                    'device_name'  => null,
                    'activated_at' => null,
                    'last_seen'    => null,
                ];
                // Cache unactivated state for 5 seconds to prevent spamming
                Cache::put($cacheKey, $licenseData, 5);
            }
        }

        $isValid = (bool) ($licenseData['is_valid'] ?? false);

        // If license is invalid or grace period expired
        if (!$isValid) {
            // API / JSON endpoint enforcement: Return 423 Locked
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'data'    => null,
                    'message' => 'License verification required. System is in Restricted Mode. Please activate your license.',
                    'code'    => 'LICENSE_RESTRICTED',
                ], 423);
            }

            // Web visit enforcement: redirect all unactivated dashboard / POS visits to /activate
            return redirect()->route('license.activate');
        }

        return $next($request);
    }

    /**
     * Determine whether the route is a mutating sale/order action that must be blocked in restricted mode.
     */
    protected function isSaleRoute(Request $request): bool
    {
        $uri = $request->path();

        // Mutating order and transaction routes
        if ($request->is('api/orders*') && !in_array($request->method(), ['GET', 'HEAD'])) {
            return true;
        }

        if ($request->is('api/transactions*') && !in_array($request->method(), ['GET', 'HEAD'])) {
            return true;
        }

        if ($request->is('api/procurements*') && !in_array($request->method(), ['GET', 'HEAD'])) {
            return true;
        }

        return false;
    }

    /**
     * Route patterns exempt from license restrictions.
     */
    protected function shouldBypass(Request $request): bool
    {
        $exemptPatterns = [
            'activate*',
            'api/activate*',
            'login*',
            'logout*',
            'forgot-password*',
            'reset-password*',
            'register*',
            'do-setup*',
            'api/setup*',
            'up',
            'sanctum/csrf-cookie',
            'assets/*',
            'fonts/*',
            'build/*',
        ];

        foreach ($exemptPatterns as $pattern) {
            if ($request->is($pattern)) {
                return true;
            }
        }

        return false;
    }
}
