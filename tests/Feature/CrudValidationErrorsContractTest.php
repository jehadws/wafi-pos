<?php

use App\Models\User;
use Illuminate\Support\Facades\Gate;

it('returns status 422 with tabId.fieldName error keys on invalid crud post', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    // 1. Test POST /api/crud/sb.payments-types
    $paymentResponse = $this->postJson('/api/crud/sb.payments-types', []);

    $paymentResponse->assertStatus(422);
    $paymentErrors = $paymentResponse->json('errors');

    expect($paymentErrors)->toBeArray();
    expect($paymentErrors)->toHaveKey('label');
    expect($paymentErrors)->toHaveKey('general.active');

    // 2. Test POST /api/crud/sb.coupons
    $couponResponse = $this->postJson('/api/crud/sb.coupons', []);

    $couponResponse->assertStatus(422);
    $couponErrors = $couponResponse->json('errors');

    expect($couponErrors)->toBeArray();
    expect($couponErrors)->toHaveKey('name');
    expect($couponErrors)->toHaveKey('general.code');
    expect($couponErrors)->toHaveKey('general.type');

    // Verify dot-key convention for tab-scoped fields
    $dotKeys = collect(array_keys($couponErrors))->filter(fn ($k) => str_contains($k, '.'));
    expect($dotKeys->isNotEmpty())->toBeTrue('Expected tab-scoped dot-keys in error bag');
    foreach ($dotKeys as $key) {
        expect($key)->toMatch('/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/');
    }
});
