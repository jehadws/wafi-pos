<?php

/**
 * Phase 1 (docs/plans/backend-driven-completion/01): the generic crud write
 * path delegates sb.procurements POST/PUT to ProcurementService through
 * beforePost/beforePut (disablePost/disablePut). Pins the write contract:
 * rows validated via ProcurementRequest (422 dot keys), procurement +
 * procurement_products rows written by the service, stock untouched for
 * non-stocked statuses, provider enforced, stocked procurements rejected
 * as a validation error on general.delivery_status.
 */

use App\Models\Procurement;
use App\Models\ProductUnitQuantity;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;

/**
 * Minimal schema-aware seeder (same approach as CrudListScopingTest, kept
 * local to avoid cross-file coupling): fills NOT NULL columns without
 * defaults so the inserts satisfy the strictest schema.
 */
function procurementWriteSeedRow(string $table, array $overrides = []): int
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

/**
 * A product procuable through ProcurementService: stock-managed,
 * non-grouped, with one unit + unit quantity.
 *
 * @return array{0: int, 1: int}
 */
function procurementWriteSeedStockedProduct(int $authorId): array
{
    $groupId = procurementWriteSeedRow('subul_units_groups', ['name' => 'Countable', 'author' => $authorId]);

    $unitId = procurementWriteSeedRow('subul_units', [
        'name' => 'Piece',
        'identifier' => 'piece-'.uniqid(),
        'author' => $authorId,
        'group_id' => $groupId,
        'value' => 1,
        'base_unit' => 1,
    ]);

    $productId = procurementWriteSeedRow('subul_products', [
        'name' => 'Procured product',
        'barcode' => 'prd-'.uniqid(),
        'barcode_type' => 'ean13',
        'sku' => 'sku-'.uniqid(),
        'type' => 'materialized',
        'stock_management' => 'enabled',
        'unit_group' => $groupId,
        'author' => $authorId,
    ]);

    procurementWriteSeedRow('subul_products_unit_quantities', [
        'product_id' => $productId,
        'unit_id' => $unitId,
        'quantity' => 10,
        'sale_price' => 15,
    ]);

    return [$productId, $unitId];
}

/**
 * A client-shaped product row — the exact keys the crud form shell's
 * buildCrudPayload emits (plus the client-only `_key`/`$invalid` the
 * backend strips).
 */
function procurementWriteProductRow(int $productId, int $unitId, int $quantity = 5, float $price = 10.0): array
{
    return [
        'product_id' => $productId,
        'unit_id' => $unitId,
        'quantity' => (string) $quantity,
        'purchase_price' => $price,
        'purchase_price_edit' => $price,
        'gross_purchase_price' => $price,
        'net_purchase_price' => $price,
        'total_price' => $price * $quantity,
        'total_purchase_price' => $price * $quantity,
        'tax_value' => 0,
        'tax_group_id' => null,
        'tax_type' => 'inclusive',
        'expiration_date' => null,
        'convert_unit_id' => null,
        'convert_unit_label' => null,
        'procurement_id' => null,
        '_key' => 'row-'.uniqid(),
        '$invalid' => false,
    ];
}

function procurementWriteGeneral(int $providerId, array $overrides = []): array
{
    return array_merge([
        'provider_id' => $providerId,
        'delivery_status' => 'pending',
        'payment_status' => 'unpaid',
        'invoice_reference' => 'INV-1',
        'delivery_time' => '2026-01-01',
        'invoice_date' => '2026-01-01',
        'automatic_approval' => 1,
    ], $overrides);
}

it('creates a procurement through the crud endpoint by delegating to ProcurementService', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $providerId = procurementWriteSeedRow('subul_providers', ['first_name' => 'John', 'last_name' => 'Doe']);
    [$productId, $unitId] = procurementWriteSeedStockedProduct($user->id);

    $response = $this->postJson('/api/crud/sb.procurements', [
        'name' => 'PO-1',
        'general' => procurementWriteGeneral($providerId),
        'products' => [procurementWriteProductRow($productId, $unitId)],
    ]);

    $response->assertStatus(200);
    expect($response->json('status'))->toBe('success');
    expect($response->json('redirect'))->toContain('/dashboard/procurements');

    $procurement = Procurement::where('name', 'PO-1')->first();

    expect($procurement)->not->toBeNull();
    expect($procurement->provider_id)->toBe($providerId);
    expect($procurement->delivery_status)->toBe('pending');
    expect($procurement->payment_status)->toBe('unpaid');
    expect($procurement->invoice_reference)->toBe('INV-1');
    expect($procurement->author)->toBe($user->id);

    // rows written by the service, client-only keys stripped
    expect($procurement->products)->toHaveCount(1);

    $row = $procurement->products[0];
    expect($row->product_id)->toBe($productId);
    expect($row->unit_id)->toBe($unitId);
    expect((float) $row->quantity)->toBe(5.0);
    expect((float) $row->purchase_price)->toBe(10.0);
    expect((float) $row->total_purchase_price)->toBe(50.0);
    expect($row->tax_type)->toBe('inclusive');
    expect($row->name)->toBe('Procured product');

    // stock invariant: a pending procurement doesn't touch the stock
    $unitQuantity = ProductUnitQuantity::where('product_id', $productId)
        ->where('unit_id', $unitId)
        ->first();

    expect((float) $unitQuantity->quantity)->toBe(10.0);
});

it('rejects a row missing a unit with a products.0.unit_id validation error', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $providerId = procurementWriteSeedRow('subul_providers', ['first_name' => 'John', 'last_name' => 'Doe']);
    [$productId, $unitId] = procurementWriteSeedStockedProduct($user->id);

    $row = procurementWriteProductRow($productId, $unitId);
    unset($row['unit_id']);

    $response = $this->postJson('/api/crud/sb.procurements', [
        'name' => 'PO-2',
        'general' => procurementWriteGeneral($providerId),
        'products' => [$row],
    ]);

    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('products.0.unit_id');
    expect(Procurement::where('name', 'PO-2')->first())->toBeNull();
});

it('enforces the provider existence on the crud write path', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    [$productId, $unitId] = procurementWriteSeedStockedProduct($user->id);

    $response = $this->postJson('/api/crud/sb.procurements', [
        'name' => 'PO-3',
        'general' => procurementWriteGeneral(999999),
        'products' => [procurementWriteProductRow($productId, $unitId)],
    ]);

    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('general.provider_id');
    expect(Procurement::where('name', 'PO-3')->first())->toBeNull();
});

it('still creates a procurement when the products section is omitted', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $providerId = procurementWriteSeedRow('subul_providers', ['first_name' => 'John', 'last_name' => 'Doe']);

    $response = $this->postJson('/api/crud/sb.procurements', [
        'name' => 'PO-4',
        'general' => procurementWriteGeneral($providerId),
    ]);

    $response->assertStatus(200);
    expect($response->json('status'))->toBe('success');

    $procurement = Procurement::where('name', 'PO-4')->first();
    expect($procurement)->not->toBeNull();
    expect($procurement->products)->toHaveCount(0);
});

it('updates a procurement through the crud endpoint by delegating to ProcurementService::edit', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $providerId = procurementWriteSeedRow('subul_providers', ['first_name' => 'John', 'last_name' => 'Doe']);
    [$productId, $unitId] = procurementWriteSeedStockedProduct($user->id);

    $procurementId = procurementWriteSeedRow('subul_procurements', [
        'name' => 'PO-5',
        'provider_id' => $providerId,
        'author' => $user->id,
        'delivery_status' => 'pending',
        'payment_status' => 'unpaid',
    ]);

    $procurementProductId = procurementWriteSeedRow('subul_procurements_products', [
        'name' => 'Procured product',
        'procurement_id' => $procurementId,
        'quantity' => 5,
        'available_quantity' => 5,
        'purchase_price' => 10,
        'total_purchase_price' => 50,
        'product_id' => $productId,
        'unit_id' => $unitId,
    ]);

    $row = procurementWriteProductRow($productId, $unitId, quantity: 8, price: 12.0);
    $row['id'] = $procurementProductId;

    $response = $this->putJson('/api/crud/sb.procurements/'.$procurementId, [
        'name' => 'PO-5 updated',
        'general' => procurementWriteGeneral($providerId, [
            'payment_status' => 'paid',
            'invoice_reference' => 'INV-2',
        ]),
        'products' => [$row],
    ]);

    $response->assertStatus(200);
    expect($response->json('status'))->toBe('success');

    $procurement = Procurement::findOrFail($procurementId);
    expect($procurement->name)->toBe('PO-5 updated');
    expect($procurement->payment_status)->toBe('paid');
    expect($procurement->invoice_reference)->toBe('INV-2');
    expect($procurement->delivery_status)->toBe('pending');

    // the row is updated in place (matched by id), not duplicated
    expect($procurement->products)->toHaveCount(1);
    expect((int) $procurement->products[0]->id)->toBe($procurementProductId);
    expect((float) $procurement->products[0]->quantity)->toBe(8.0);
    expect((float) $procurement->products[0]->purchase_price)->toBe(12.0);

    // stock untouched
    $unitQuantity = ProductUnitQuantity::where('product_id', $productId)
        ->where('unit_id', $unitId)
        ->first();

    expect((float) $unitQuantity->quantity)->toBe(10.0);
});

it('rejects editing a stocked procurement with a 422 on general.delivery_status', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $providerId = procurementWriteSeedRow('subul_providers', ['first_name' => 'John', 'last_name' => 'Doe']);
    [$productId, $unitId] = procurementWriteSeedStockedProduct($user->id);

    $procurementId = procurementWriteSeedRow('subul_procurements', [
        'name' => 'Stocked PO',
        'provider_id' => $providerId,
        'author' => $user->id,
        'delivery_status' => 'stocked',
        'payment_status' => 'unpaid',
    ]);

    $response = $this->putJson('/api/crud/sb.procurements/'.$procurementId, [
        'name' => 'Stocked PO',
        'general' => procurementWriteGeneral($providerId),
        'products' => [procurementWriteProductRow($productId, $unitId)],
    ]);

    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('general.delivery_status');
    expect($response->json('errors')['general.delivery_status'][0])->toContain('stocked');

    // untouched
    expect(Procurement::findOrFail($procurementId)->payment_status)->toBe('unpaid');
});
