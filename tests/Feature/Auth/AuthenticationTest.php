<?php

use App\Classes\Hook;
use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('login screen delivers backend fields prop via Inertia', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);

    $page = $response->viewData('page');
    $fields = $page['props']['fields'];

    expect($fields)->toBeArray();
    expect($fields)->toHaveCount(2);
    expect($fields[0]['name'])->toBe('username');
    expect($fields[1]['name'])->toBe('password');

    expect(array_key_exists('canResetPassword', $page['props']))->toBeTrue();
    expect(array_key_exists('status', $page['props']))->toBeTrue();
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post('/login', [
        'username' => $user->username,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('sb.dashboard.home', absolute: false));
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'username' => $user->username,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});

test('login is rate limited after 5 failed attempts', function () {
    $user = User::factory()->create([
        'username' => 'ratelimituser2',
    ]);

    $throttleKey = Str::transliterate(Str::lower($user->username) . '|' . '127.0.0.1');
    RateLimiter::clear($throttleKey);

    for ($i = 1; $i <= 5; $i++) {
        $response = $this->post('/login', [
            'username' => $user->username,
            'password' => 'wrong-password',
        ]);
        $response->assertSessionHasErrors('username');
    }

    $response = $this->post('/login', [
        'username' => $user->username,
        'password' => 'wrong-password',
    ]);
    $response->assertStatus(302);
    $response->assertSessionHasErrors('username');
    $errorBag = $response->getSession()->get('errors');
    $this->assertNotNull($errorBag, 'Expected error bag in session');
    $usernameErrors = $errorBag->get('username');
    $hasThrottleMessage = collect($usernameErrors)->contains(fn ($msg) => str_contains($msg, 'seconds') || str_contains($msg, 'minutes') || str_contains($msg, 'throttle') || str_contains($msg, 'Too Many Attempts'));
    $this->assertTrue($hasThrottleMessage, 'Expected throttle/lockout error message after 6 failed attempts. Got: ' . implode(', ', $usernameErrors));

    RateLimiter::clear($throttleKey);
    usleep(100000);

    $response = $this->post('/login', [
        'username' => $user->username,
        'password' => 'wrong-password',
    ]);
    $response->assertSessionHasErrors('username');
    $errorBag = $response->getSession()->get('errors');
    $usernameErrors = $errorBag->get('username');
    $stillThrottled = collect($usernameErrors)->contains(fn ($msg) => str_contains($msg, 'seconds') || str_contains($msg, 'minutes') || str_contains($msg, 'throttle') || str_contains($msg, 'Too Many Attempts'));
    $this->assertFalse($stillThrottled, 'After clearing throttle, should get normal auth error, not throttle error');
});

test('inactive users are rejected after successful authentication attempt', function () {
    $user = User::factory()->create([
        'username' => 'inactiveuser',
        'active' => false,
    ]);

    $response = $this->post('/login', [
        'username' => $user->username,
        'password' => 'password',
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors('username');
});

test('user factory fires sb-user-factory hook filter with sb prefix', function () {
    $filter = function ($attrs) {
        return array_merge($attrs, ['username' => 'listener-wins']);
    };

    Hook::addFilter('sb-user-factory', $filter, 10, 1);

    try {
        $user = User::factory()->create();
        $this->assertSame('listener-wins', $user->username);
    } finally {
        Hook::removeFilter('sb-user-factory', $filter);
    }
});