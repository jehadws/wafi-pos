<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

test('confirm password screen delivers backend fields prop via Inertia', function () {
    $user = User::factory()->create([
        'username' => 'confirmfieldsuser',
        'email' => 'confirmfields@example.com',
    ]);

    $response = $this->actingAs($user)->get('/confirm-password');

    $response->assertStatus(200);

    $page = $response->viewData('page');
    $fields = $page['props']['fields'];

    expect($fields)->toBeArray();
    expect($fields)->toHaveCount(1);
    expect($fields[0]['name'])->toBe('password');
    expect($fields[0]['type'])->toBe('password');
});

test('confirm password uses username guard key instead of email', function () {
    $user = User::factory()->create([
        'username' => 'testuser',
        'email' => 'different@example.com',
        'password' => Hash::make('correct-password'),
    ]);

    $this->assertTrue(
        Auth::guard('web')->validate([
            'username' => $user->username,
            'password' => 'correct-password',
        ]),
        'Contract check: username-based guard validation must work'
    );
});

test('password confirmation fails with wrong password', function () {
    $user = User::factory()->create([
        'username' => 'testuser2',
        'email' => 'different2@example.com',
        'password' => Hash::make('correct-password'),
    ]);

    $response = $this->actingAs($user)->post('/confirm-password', [
        'password' => 'wrong-password',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('password');
    $this->assertNull(session()->get('auth.password_confirmed_at'));
});

test('password confirmation succeeds with correct password and sets timestamp', function () {
    $user = User::factory()->create([
        'username' => 'testuser3',
        'email' => 'different3@example.com',
        'password' => Hash::make('correct-password'),
    ]);

    $before = time();

    $response = $this->actingAs($user)->post('/confirm-password', [
        'password' => 'correct-password',
    ]);

    $after = time();

    $response->assertRedirect(route('sb.dashboard.home', absolute: false));
    $response->assertSessionHasNoErrors();

    $confirmedAt = session()->get('auth.password_confirmed_at');
    $this->assertNotNull($confirmedAt);
    $this->assertIsInt($confirmedAt);
    $this->assertGreaterThanOrEqual($before, $confirmedAt);
    $this->assertLessThanOrEqual($after, $confirmedAt);
});
