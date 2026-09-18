<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Settings\GeneralSettings;
use Closure;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Handle the incoming request.
     * Override to handle session expiry gracefully for Inertia XHR requests.
     * When session expires, Inertia gets a 409 Conflict which triggers a full
     * page reload to the login page instead of a broken partial state.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Run the controller exactly once, inside the parent middleware so that
        // Inertia::share() (which injects the `ziggy` route config) and the
        // root view are configured *before* the response is rendered. Wrapping
        // $next lets us inspect the result for a session-expiry redirect to
        // /login and convert it to the 409 Inertia expects — without executing
        // the controller a second time or skipping the `ziggy` shared prop
        // (which would leave `route` undefined during SSR).
        return parent::handle($request, function ($request) use ($next) {
            $response = $next($request);

            $requestPath = '/'.ltrim($request->getPathInfo(), '/');

            // Detect a redirect to the login page on an Inertia XHR request
            // (session expired or unauthenticated). Never convert while the
            // request is already ON the login page — e.g. a failed login POST
            // redirects back to /login with validation errors, and swallowing
            // that into a 409 would drop the error feedback (covered by
            // tests/Feature/Auth/LoginInactiveFeedbackTest.php).
            if (
                $request->header('X-Inertia') &&
                $response->isRedirect() &&
                in_array($response->getStatusCode(), [301, 302, 303, 307, 308]) &&
                str_contains($response->headers->get('Location', ''), '/login') &&
                ! str_contains($requestPath, '/login')
            ) {
                return response('', 409)->header('X-Inertia-Location', $response->headers->get('Location'));
            }

            return $response;
        });
    }

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => \App\Services\Helper::installed() ? $request->user() : null,
                'roles' => (\App\Services\Helper::installed() && $request->user()) ? $request->user()?->roles()->pluck('namespace')->toArray() ?? [] : [],
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'locale' => app()->getLocale(),
            'menus' => (\App\Services\Helper::installed() && $request->user()) ?
                app()->make(\App\Services\MenuService::class)->getMenus() :
                [],
            'settings' => \App\Services\Helper::installed() ? (new GeneralSettings)->getPayload() : [],
            'license'  => function () {
                if (!\App\Services\Helper::installed()) {
                    return ['isValid' => true, 'isRestricted' => false];
                }

                $hwid = \App\Services\HwidService::generate();
                $licenseData = \Illuminate\Support\Facades\Cache::get("license_{$hwid}");

                if ($licenseData === null) {
                    $license = \App\Models\License::where('hwid', $hwid)->where('is_active', true)->first();
                    $isValid = (bool) ($license && $license->isValid());
                } else {
                    $isValid = (bool) ($licenseData['is_valid'] ?? false);
                }

                return [
                    'isValid'          => $isValid,
                    'isRestricted'     => !$isValid,
                    'hwid'             => $hwid,
                    'gracePeriodHours' => 24,
                ];
            },
        ];
    }
}


