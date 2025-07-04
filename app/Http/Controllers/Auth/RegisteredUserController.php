<?php

namespace App\Http\Controllers\Auth;

use App\Classes\Hook;
use App\Http\Controllers\Controller;
use App\Http\Requests\SignUpRequest;
use App\Services\UsersService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class RegisteredUserController extends Controller
{

    public function __construct(private UsersService $userService) {}
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(SignUpRequest $request): RedirectResponse
    {
        // $request->validate([
        //     'name' => 'required|string|max:255',
        //     'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
        //     'password' => ['required', 'confirmed', Rules\Password::defaults()],
        // ]);
        //
        // $user = User::create([
        //     'name' => $request->name,
        //     'email' => $request->email,
        //     'password' => Hash::make($request->password),
        // ]);
        //
        // event(new Registered($user));
        //
        // Auth::login($user);

        Hook::action('ns-register-form', $request);

        try {
            $response = $this->userService->setUser($request->only([
                'username',
                'email',
                'password',
            ]));

            if ($request->expectsJson()) {
                return $response;
            } else {
                return redirect()->route('login', [
                    'status' => 'success',
                    'message' => $response['message'],
                ]);
            }
        } catch (Exception $exception) {
            if ($request->expectsJson()) {
                throw $exception;
            } else {
                return redirect()->route('register')->withErrors([
                    'username' => $exception->getMessage(),
                ]);
            }
        }
    }
}

