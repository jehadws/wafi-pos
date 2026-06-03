<?php

namespace App\Http\Controllers\Auth;

use App\Classes\Hook;
use App\Classes\JsonResponse;
use App\Events\AfterSuccessfulLoginEvent;
use App\Exceptions\NotAllowedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\SignInRequest;
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
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // $request->authenticate();
        //
        // $request->session()->regenerate();
        //
        // return redirect()->intended(route('dashboard', absolute: false));

        Hook::action('ns-login-form', $request);

        // Set remember me cookie to 30 days (industry standard: security + convenience)
        Auth::guard('web')->setRememberDuration(60 * 24 * 30);

        $attempt = Auth::attempt([
            'username' => $request->input('username'),
            'password' => $request->input('password'),
        ], $request->boolean('remember'));

        if ($request->expectsJson()) {
            return $this->handleJsonRequests($request, $attempt);
        } else {
            return $this->handleNormalRequests($request, $attempt);
        }
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


    public function handleNormalRequests($request, $attempt)
    {
        if ($attempt) {
            /**
             * check if the account is authorized to
             * login
             */
            if (! auth::user()->active) {
                auth::logout();

                $validator = validator::make($request->all(), []);
                $validator->errors()->add('username', __('this account is disabled.'));

                return redirect(route('login'))->witherrors($validator);
            }

            // return redirect()->intended(Hook::filter('ns-login-redirect'));
            $request->session()->regenerate();
            return redirect()->intended(route('dashboard', absolute: false));
        }

        $validator = Validator::make($request->all(), []);
        $validator->errors()->add('username', __('Unable to find record having that username.'));
        $validator->errors()->add('password', __('Unable to find record having that password.'));

        return redirect(route('login'))->withErrors($validator);
    }

    public function handleJsonRequests($request, $attempt)
    {
        if (! $attempt) {
            throw new NotAllowedException(__('Invalid username or password.'));
        }

        if (! auth::user()->active) {
            auth::logout();
            throw new notallowedexception(__('unable to login, the provided account is not active.'));
        }

        $intended = redirect()->intended()->getTargetUrl();
        $request->session()->regenerate();

        event(new AfterSuccessfulLoginEvent(auth::user()));

        return JsonResponse::success(
            message: __('You have been successfully connected.'),
            data: [
                'redirectTo' => Hook::filter(
                    'ns-login-redirect',
                    // ($intended) === url('/') ? ns()->route('ns.dashboard.home') : $intended,
                    ($intended) === url('/') ? route('dashboard') : $intended,
                    redirect()->intended()->getTargetUrl() ? true : false
                ),
            ]
        );
    }
}
