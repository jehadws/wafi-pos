<?php

use App\Models\Procurement;
use App\Models\ProcurementProduct;
use App\Models\Product;
use App\Models\ProductUnitQuantity;
use App\Models\User;
use App\Services\ProcurementService;
use App\Services\ProductService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Minimal schema-aware seeder for tests.
 */
function puqSeedRow(string $table, array $overrides = []): int
{
    $row = [];

    foreach (Schema::getColumns($table) as $column) {
        $name = $column['name'];

        if ($name === 'id' || array_key_exists($name, $overrides) || $column['nullable']) {
            continue;
        }

        $default = $column['default'];

        if ($default !== null) {
            $default = (string) $default;

            $row[$name] = preg_match('/^current_timestamp/i', $default) === 1
                ? now()->toDateTimeString()
                : trim($default, "'");

            continue;
        }

        $type = strtolower((string) $column['type']);

        $row[$name] = match (true) {
            str_contains($type, 'int') || str_contains($type, 'decimal') || str_contains($type, 'float') || str_contains($type, 'double') => 0,
            str_contains($type, 'datetime') || str_contains($type, 'timestamp') => now()->toDateTimeString(),
            default => '',
        };
    }

    DB::table($table)->insert(array_merge($row, $overrides));

    return (int) DB::getPdo()->lastInsertId();
}

it('initializes price on a newly created ProductUnitQuantity row during procurement stocking', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $providerId = puqSeedRow('subul_providers', ['first_name' => 'Acme', 'last_name' => 'Supplies']);
    $groupId = puqSeedRow('subul_units_groups', ['name' => 'Countable', 'author' => $user->id]);

    $unitId = puqSeedRow('subul_units', [
        'name' => 'Box',
        'identifier' => 'box-'.uniqid(),
        'author' => $user->id,
        'group_id' => $groupId,
        'value' => 1,
        'base_unit' => 1,
    ]);

    $productId = puqSeedRow('subul_products', [
        'name' => 'Stocked item',
        'barcode' => 'BAR-'.uniqid(),
        'barcode_type' => 'ean13',
        'sku' => 'sku-'.uniqid(),
        'type' => 'materialized',
        'stock_management' => 'enabled',
        'unit_group' => $groupId,
        'author' => $user->id,
    ]);

    // Ensure no ProductUnitQuantity exists for this product and unit initially
    expect(ProductUnitQuantity::where('product_id', $productId)->where('unit_id', $unitId)->count())->toBe(0);

    $procurementId = puqSeedRow('subul_procurements', [
        'name' => 'PO-Stocking-New-Unit',
        'provider_id' => $providerId,
        'author' => $user->id,
        'delivery_status' => Procurement::DELIVERED,
        'payment_status' => 'paid',
    ]);

    puqSeedRow('subul_procurements_products', [
        'procurement_id' => $procurementId,
        'product_id' => $productId,
        'unit_id' => $unitId,
        'name' => 'Stocked item',
        'barcode' => 'PROCUR-'.uniqid(),
        'quantity' => 15,
        'available_quantity' => 15,
        'purchase_price' => 45.50,
        'gross_purchase_price' => 45.50,
        'net_purchase_price' => 45.50,
        'total_purchase_price' => 682.50,
        'author' => $user->id,
    ]);

    $procurement = Procurement::with('products')->findOrFail($procurementId);

    app(ProcurementService::class)->handleProcurement($procurement);

    $unitQuantity = ProductUnitQuantity::where('product_id', $productId)
        ->where('unit_id', $unitId)
        ->first();

    expect($unitQuantity)->not->toBeNull();
    expect((float) $unitQuantity->quantity)->toBe(15.0);
    expect((float) $unitQuantity->sale_price)->toBe(45.50);
    expect((float) $unitQuantity->sale_price_edit)->toBe(45.50);
    expect((float) $unitQuantity->sale_price_with_tax)->toBe(45.50);
    expect((float) $unitQuantity->sale_price_without_tax)->toBe(45.50);
    expect((float) $unitQuantity->cogs)->toBe(45.50);
    expect($unitQuantity->visible)->toBeTrue();
    expect($unitQuantity->barcode)->not->toBeEmpty();
});

it('preserves existing prices when stocking an existing ProductUnitQuantity row', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $providerId = puqSeedRow('subul_providers', ['first_name' => 'Acme', 'last_name' => 'Supplies']);
    $groupId = puqSeedRow('subul_units_groups', ['name' => 'Countable', 'author' => $user->id]);

    $unitId = puqSeedRow('subul_units', [
        'name' => 'Piece',
        'identifier' => 'pc-'.uniqid(),
        'author' => $user->id,
        'group_id' => $groupId,
        'value' => 1,
        'base_unit' => 1,
    ]);

    $productId = puqSeedRow('subul_products', [
        'name' => 'Existing item',
        'barcode' => 'BAR-'.uniqid(),
        'barcode_type' => 'ean13',
        'sku' => 'sku-'.uniqid(),
        'type' => 'materialized',
        'stock_management' => 'enabled',
        'unit_group' => $groupId,
        'author' => $user->id,
    ]);

    // Pre-existing row with established catalog sale_price of 99.00
    $puqId = puqSeedRow('subul_products_unit_quantities', [
        'product_id' => $productId,
        'unit_id' => $unitId,
        'quantity' => 10,
        'sale_price' => 99.00,
        'sale_price_edit' => 99.00,
        'sale_price_with_tax' => 99.00,
        'sale_price_without_tax' => 99.00,
        'wholesale_price' => 80.00,
        'cogs' => 30.00,
    ]);

    $procurementId = puqSeedRow('subul_procurements', [
        'name' => 'PO-Stocking-Existing-Unit',
        'provider_id' => $providerId,
        'author' => $user->id,
        'delivery_status' => Procurement::DELIVERED,
        'payment_status' => 'paid',
    ]);

    puqSeedRow('subul_procurements_products', [
        'procurement_id' => $procurementId,
        'product_id' => $productId,
        'unit_id' => $unitId,
        'name' => 'Existing item',
        'barcode' => 'PROCUR-'.uniqid(),
        'quantity' => 5,
        'available_quantity' => 5,
        'purchase_price' => 25.00, // Different from sale price 99.00
        'total_purchase_price' => 125.00,
        'author' => $user->id,
    ]);

    $procurement = Procurement::with('products')->findOrFail($procurementId);

    app(ProcurementService::class)->handleProcurement($procurement);

    $unitQuantity = ProductUnitQuantity::findOrFail($puqId);

    // Quantity incremented 10 + 5 = 15
    expect((float) $unitQuantity->quantity)->toBe(15.0);
    // Catalog price preserved untouched
    expect((float) $unitQuantity->sale_price)->toBe(99.00);
    expect((float) $unitQuantity->sale_price_edit)->toBe(99.00);
    expect((float) $unitQuantity->wholesale_price)->toBe(80.00);
});

it('logs a warning and sets price to 0 when setQuantity creates a row without price or procurement context', function () {
    $user = User::factory()->create();

    $groupId = puqSeedRow('subul_units_groups', ['name' => 'Weight', 'author' => $user->id]);

    $unitId = puqSeedRow('subul_units', [
        'name' => 'Gram',
        'identifier' => 'g-'.uniqid(),
        'author' => $user->id,
        'group_id' => $groupId,
        'value' => 1,
        'base_unit' => 1,
    ]);

    $productId = puqSeedRow('subul_products', [
        'name' => 'Priceless item',
        'barcode' => 'BAR-'.uniqid(),
        'barcode_type' => 'ean13',
        'sku' => 'sku-'.uniqid(),
        'type' => 'materialized',
        'stock_management' => 'enabled',
        'unit_group' => $groupId,
        'author' => $user->id,
    ]);

    Log::shouldReceive('warning')
        ->once()
        ->withArgs(function (string $message) use ($productId, $unitId) {
            return str_contains($message, (string) $productId) && str_contains($message, (string) $unitId);
        });

    $result = app(ProductService::class)->setQuantity($productId, $unitId, 20);

    expect($result['status'])->toBe('success');

    $unitQuantity = ProductUnitQuantity::where('product_id', $productId)
        ->where('unit_id', $unitId)
        ->first();

    expect($unitQuantity)->not->toBeNull();
    expect((float) $unitQuantity->quantity)->toBe(20.0);
    expect((float) $unitQuantity->sale_price)->toBe(0.0);
});

it('respects custom sale_price option when setQuantity creates a new row', function () {
    $user = User::factory()->create();

    $groupId = puqSeedRow('subul_units_groups', ['name' => 'Volume', 'author' => $user->id]);

    $unitId = puqSeedRow('subul_units', [
        'name' => 'Liter',
        'identifier' => 'l-'.uniqid(),
        'author' => $user->id,
        'group_id' => $groupId,
        'value' => 1,
        'base_unit' => 1,
    ]);

    $productId = puqSeedRow('subul_products', [
        'name' => 'Liquid item',
        'barcode' => 'BAR-'.uniqid(),
        'barcode_type' => 'ean13',
        'sku' => 'sku-'.uniqid(),
        'type' => 'materialized',
        'stock_management' => 'enabled',
        'unit_group' => $groupId,
        'author' => $user->id,
    ]);

    $result = app(ProductService::class)->setQuantity(
        $productId,
        $unitId,
        50,
        options: ['sale_price' => 12.75, 'cogs' => 8.50]
    );

    expect($result['status'])->toBe('success');

    $unitQuantity = ProductUnitQuantity::where('product_id', $productId)
        ->where('unit_id', $unitId)
        ->first();

    expect($unitQuantity)->not->toBeNull();
    expect((float) $unitQuantity->quantity)->toBe(50.0);
    expect((float) $unitQuantity->sale_price)->toBe(12.75);
    expect((float) $unitQuantity->cogs)->toBe(8.50);
});

it('computes taxes on newly created ProductUnitQuantity during procurement stocking when tax group is present', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $providerId = puqSeedRow('subul_providers', ['first_name' => 'Taxed', 'last_name' => 'Supplier']);
    $groupId = puqSeedRow('subul_units_groups', ['name' => 'TaxableGroup', 'author' => $user->id]);

    $taxGroupId = puqSeedRow('subul_taxes_groups', ['name' => 'VAT 10%']);
    puqSeedRow('subul_taxes', [
        'name' => 'VAT',
        'rate' => 10,
        'tax_group_id' => $taxGroupId,
    ]);

    $unitId = puqSeedRow('subul_units', [
        'name' => 'Pack',
        'identifier' => 'pack-'.uniqid(),
        'author' => $user->id,
        'group_id' => $groupId,
        'value' => 1,
        'base_unit' => 1,
    ]);

    $productId = puqSeedRow('subul_products', [
        'name' => 'Taxed item',
        'barcode' => 'BAR-'.uniqid(),
        'barcode_type' => 'ean13',
        'sku' => 'sku-'.uniqid(),
        'type' => 'materialized',
        'stock_management' => 'enabled',
        'tax_group_id' => $taxGroupId,
        'tax_type' => 'exclusive',
        'unit_group' => $groupId,
        'author' => $user->id,
    ]);

    $procurementId = puqSeedRow('subul_procurements', [
        'name' => 'PO-Stocking-Taxed',
        'provider_id' => $providerId,
        'author' => $user->id,
        'delivery_status' => Procurement::DELIVERED,
        'payment_status' => 'paid',
    ]);

    puqSeedRow('subul_procurements_products', [
        'procurement_id' => $procurementId,
        'product_id' => $productId,
        'unit_id' => $unitId,
        'name' => 'Taxed item',
        'barcode' => 'PROCUR-'.uniqid(),
        'quantity' => 10,
        'available_quantity' => 10,
        'purchase_price' => 100.00,
        'gross_purchase_price' => 110.00,
        'net_purchase_price' => 100.00,
        'total_purchase_price' => 1000.00,
        'tax_group_id' => $taxGroupId,
        'tax_type' => 'exclusive',
        'author' => $user->id,
    ]);

    $procurement = Procurement::with('products')->findOrFail($procurementId);

    app(ProcurementService::class)->handleProcurement($procurement);

    $unitQuantity = ProductUnitQuantity::where('product_id', $productId)
        ->where('unit_id', $unitId)
        ->first();

    expect($unitQuantity)->not->toBeNull();
    expect((float) $unitQuantity->quantity)->toBe(10.0);
    // Base purchase price is 100. Exclusive tax of 10% means:
    // without_tax = 100, tax = 10, with_tax = 110, sale_price = 110
    expect((float) $unitQuantity->sale_price_without_tax)->toBe(100.00);
    expect((float) $unitQuantity->sale_price_with_tax)->toBe(110.00);
    expect((float) $unitQuantity->sale_price)->toBe(110.00);
    expect((float) $unitQuantity->sale_price_tax)->toBe(10.00);
});
