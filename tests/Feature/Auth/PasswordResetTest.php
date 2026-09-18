<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;

test('reset password link screen can be rendered', function () {
    $response = $this->get('/forgot-password');

    $response->assertStatus(200);
});

test('forgot password screen delivers backend fields prop via Inertia', function () {
    $response = $this->get('/forgot-password');

    $response->assertStatus(200);

    $page = $response->viewData('page');
    $fields = $page['props']['fields'];

    expect($fields)->toBeArray();
    expect($fields)->toHaveCount(1);
    expect($fields[0]['name'])->toBe('email');

    expect(array_key_exists('status', $page['props']))->toBeTrue();
});

test('reset password link can be requested', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPassword::class);
});

test('reset password screen can be rendered', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPassword::class, function ($notification) {
        $response = $this->get('/reset-password/'.$notification->token);

        $response->assertStatus(200);

        return true;
    });
});

test('reset password screen delivers backend fields prop via Inertia', function () {
    $response = $this->get('/reset-password/dummytoken?email=foo@bar.com');

    $response->assertStatus(200);

    $page = $response->viewData('page');
    $fields = $page['props']['fields'];

    expect($fields)->toBeArray();
    expect($fields)->toHaveCount(4);

    $names = array_column($fields, 'name');
    expect($names)->toContain('email', 'password', 'password_confirmation', 'token');

    expect($page['props']['token'])->toBe('dummytoken');
    expect($page['props']['email'])->toBe('foo@bar.com');
});

test('password can be reset with valid token', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
        $response = $this->post('/reset-password', [
            'token' => $notification->token,
            'email' => $user->email,
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('login'));

        return true;
    });
});