<?php

use App\Models\User;

test('user fillable includes first_name and other expanded fields', function () {
    $fillable = (new User())->getFillable();

    $this->assertArrayHasKey('first_name', array_flip($fillable));
    $this->assertArrayHasKey('last_name', array_flip($fillable));
    $this->assertArrayHasKey('gender', array_flip($fillable));
    $this->assertArrayHasKey('phone', array_flip($fillable));
    $this->assertArrayHasKey('birth_date', array_flip($fillable));
    $this->assertArrayHasKey('total_sales_count', array_flip($fillable));
    $this->assertArrayHasKey('account_amount', array_flip($fillable));
    $this->assertArrayHasKey('activation_token', array_flip($fillable));
});

test('user fillable does not contain dead role_id entry', function () {
    $fillable = (new User())->getFillable();

    $this->assertNotContains('role_id', $fillable);
});

test('user casts total_sales_count to integer', function () {
    $user = User::create([
        'username' => 'castintuser',
        'email' => 'castintuser@example.com',
        'password' => bcrypt('secret'),
        'active' => true,
        'total_sales_count' => 123,
    ]);

    $this->assertIsInt($user->total_sales_count);
});

test('user casts total_sales to float', function () {
    $user = User::create([
        'username' => 'castfltuser',
        'email' => 'castfltuser@example.com',
        'password' => bcrypt('secret'),
        'active' => true,
        'total_sales' => 99.50,
    ]);

    $this->assertIsFloat($user->total_sales);
});

test('user toArray returns numeric types not strings for cast fields', function () {
    $user = User::create([
        'username' => 'castarruser',
        'email' => 'castarruser@example.com',
        'password' => bcrypt('secret'),
        'total_sales_count' => 123,
        'active' => true,
    ]);

    $array = $user->toArray();

    $this->assertSame(123, $array['total_sales_count']);
    $this->assertSame(true, $array['active']);
});
