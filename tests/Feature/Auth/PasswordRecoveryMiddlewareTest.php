<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

test('forgot password is accessible by default when recovery option is not set', function () {
    $response = $this->get('/forgot-password');

    $response->assertStatus(200);
});

test('forgot password is blocked when sb_recovery_enabled is no', function () {
    sb()->option->set('sb_recovery_enabled', 'no');

    $response = $this->get('/forgot-password');

    $response->assertForbidden();
});

test('forgot password post is blocked when recovery disabled and no mail is sent', function () {
    sb()->option->set('sb_recovery_enabled', 'no');

    Mail::fake();
    Notification::fake();

    $user = User::factory()->create();

    $response = $this->post('/forgot-password', ['email' => $user->email]);

    $response->assertForbidden();

    Mail::assertNothingSent();
    Notification::assertNothingSent();
});

test('reset password get is blocked when sb_recovery_enabled is no', function () {
    sb()->option->set('sb_recovery_enabled', 'no');

    $response = $this->get('/reset-password/anytoken');

    $response->assertForbidden();
});

test('reset password post is blocked when sb_recovery_enabled is no', function () {
    sb()->option->set('sb_recovery_enabled', 'no');

    Notification::fake();

    $user = User::factory()->create();

    $response = $this->post('/reset-password', [
        'token' => 'anytoken',
        'email' => $user->email,
        'password' => 'newpassword',
        'password_confirmation' => 'newpassword',
    ]);

    $response->assertForbidden();

    Notification::assertNothingSent();
});
