<?php

namespace App\Http\Controllers\Auth;

use App\Classes\Hook;
use App\Classes\JsonResponse;
use App\Events\AfterSuccessfulLoginEvent;
use App\Exceptions\NotAllowedException;
use App\Fields\AuthLoginFields;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;


class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'fields' => app(AuthLoginFields::class)->get(),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        Hook::action('sb-login-form', $request);

        $request->authenticate();

        if (! Auth::user()->active) {
            Auth::logout();

            $validator = Validator::make($request->all(), []);
            $validator->errors()->add('username', __('This account is disabled.'));

            if ($request->expectsJson()) {
                throw new NotAllowedException(__('Unable to login, the provided account is not active.'));
            }

            return redirect()->back(fallback: route('login'))->withInput($request->only('username', 'remember'))->withErrors($validator);
        }

        Auth::guard('web')->setRememberDuration(60 * 24 * 30);

        $request->session()->regenerate();

        if (config('session.driver') === 'database') {
            $request->user()->update(['session_id' => $request->session()->getId()]);
        }

        event(new AfterSuccessfulLoginEvent(Auth::user()));

        if ($request->expectsJson()) {
            $intended = redirect()->intended()->getTargetUrl();

            return JsonResponse::success(
                message: __('You have been successfully connected.'),
                data: [
                    'redirectTo' => Hook::filter(
                        'sb-login-redirect',
                        ($intended) === url('/') ? sb()->route('sb.dashboard.home') : $intended,
                        redirect()->intended()->getTargetUrl() ? true : false
                    ),
                ]
            );
        }

        return redirect()->intended(Hook::filter('sb-login-redirect', route('sb.dashboard.home', absolute: false)));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
