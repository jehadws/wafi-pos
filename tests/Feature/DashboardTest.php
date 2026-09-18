<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated users can visit the dashboard', function () {
    /**
     * The dashboard route is guarded by `read.dashboard` (SbRestrictMiddleware);
     * factory users carry no role, so grant the seeded admin role.
     */
    $this->actingAs($user = User::factory()->create());
    $user->assignRole('admin');

    $this->get('/dashboard')->assertOk();
});