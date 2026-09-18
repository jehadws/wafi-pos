<?php

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('it returns 404 if category does not exist for variations request', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/categories/999999/variations');

    $response->assertNotFound();
});

test('it successfully returns variations belonging to the category without method call errors', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    \App\Models\UnitGroup::factory()->create();
    \App\Models\TaxGroup::factory()->create();

    $category = ProductCategory::factory()->create();

    $variation = Product::factory()->create([
        'category_id' => $category->id,
        'product_type' => 'variation',
        'status' => Product::STATUS_AVAILABLE,
    ]);

    $regularProduct = Product::factory()->create([
        'category_id' => $category->id,
        'product_type' => 'product',
        'status' => Product::STATUS_AVAILABLE,
    ]);

    $response = $this->getJson("/api/categories/{$category->id}/variations");

    $response->assertOk();
    $data = $response->json();
    expect($data)->toHaveCount(1);
    expect($data[0]['id'])->toBe($variation->id);
    expect($data[0]['product_type'])->toBe('variation');
});
