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

it('preserves 0, "0", and false while omitting null and empty strings in getFlatForm', function () {
    $service = new class extends \App\Services\CrudService {
        public function getForm($entry = null)
        {
            return [
                'main' => ['name' => 'name'],
                'tabs' => [
                    'general' => [
                        'identifier' => 'general',
                        'fields' => [
                            ['name' => 'zero_num'],
                            ['name' => 'zero_str'],
                            ['name' => 'bool_false'],
                            ['name' => 'empty_str'],
                            ['name' => 'null_val'],
                            ['name' => 'valid_text'],
                        ],
                    ],
                ],
            ];
        }
    };

    $inputs = [
        'name' => 'Test',
        'general' => [
            'zero_num' => 0,
            'zero_str' => '0',
            'bool_false' => false,
            'empty_str' => '',
            'null_val' => null,
            'valid_text' => 'hello',
        ],
    ];

    $flat = $service->getFlatForm($inputs);

    expect($flat)->toHaveKey('name', 'Test');
    expect($flat)->toHaveKey('zero_num', 0);
    expect($flat)->toHaveKey('zero_str', '0');
    expect($flat)->toHaveKey('bool_false', false);
    expect($flat)->toHaveKey('valid_text', 'hello');
    expect($flat)->not->toHaveKey('empty_str');
    expect($flat)->not->toHaveKey('null_val');
});
