<?php

use App\Models\User;

/**
 * The product ships with registration closed (`sb_registration_enabled`
 * defaults to 'no', enforced by RegistrationMiddleware) and registers by
 * username — not the Laravel Breeze defaults these routes were scaffolded
 * from.
 */

test('registration screen can be rendered', function () {
    sb()->option->set('sb_registration_enabled', 'yes');

    $response = $this->get('/register');

    $response->assertOk();
});

test('registration screen delivers backend fields prop via Inertia', function () {
    sb()->option->set('sb_registration_enabled', 'yes');

    $response = $this->get('/register');

    $response->assertOk();

    $page = $response->viewData('page');
    $fields = $page['props']['fields'];

    expect($fields)->toBeArray();
    expect($fields)->toHaveCount(4);

    $names = array_column($fields, 'name');
    expect($names)->toContain('username', 'email', 'password', 'password_confirmation');
});

test('registration screen is not accessible while registration is disabled', function () {
    $response = $this->get('/register');

    $response->assertForbidden();
});

test('new users can register', function () {
    sb()->option->set('sb_registration_enabled', 'yes');

    $response = $this->post('/register', [
        'username' => 'testuser',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirm' => 'password',
    ]);

    /**
     * The registration flow redirects to the login screen with a status
     * message; it does not authenticate the visitor. With the default
     * "Requires Validation" setting the new account stays inactive until
     * activated, and is assigned the base "user" role when the store did
     * not configure a dedicated registration role.
     */
    $response->assertRedirect();
    $this->assertGuest();

    $location = $response->headers->get('Location');

    expect(parse_url($location, PHP_URL_PATH))->toBe('/login');
    expect(parse_url($location, PHP_URL_QUERY))->toContain('status=success');

    $registered = User::where('username', 'testuser')->first();
    expect($registered)->not->toBeNull();
    expect($registered->active)->toBeFalse();
});