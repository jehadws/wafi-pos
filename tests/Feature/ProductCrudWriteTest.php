<?php

/**
 * Phase 5 (docs/plans/backend-driven-completion/05): the generic crud write
 * path delegates sb.products POST/PUT to ProductService through
 * beforePost/beforePut (disablePost/disablePut). Pins the write contract:
 * the ConfigForm-shaped `variations` payload is flattened by
 * ProductCrud::getFlatForm, validated via ProductRequest (flat 422 keys),
 * and the product + unit quantities (+ gallery, sub items) are written by
 * ProductService — stock quantities are never reset by an edit.
 */

use App\Models\Product;
use App\Models\ProductUnitQuantity;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;

/**
 * Minimal schema-aware seeder (same approach as ProcurementCrudWriteTest):
 * fills NOT NULL columns without defaults so the inserts satisfy the
 * strictest schema.
 */
function productWriteSeedRow(string $table, array $overrides = []): int
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
 * A unit group + unit + category + tax group: the relations a product form
 * payload references.
 *
 * @return array{unitGroupId: int, unitId: int, categoryId: int, taxGroupId: int}
 */
function productWriteSeedRelations(int $authorId): array
{
    $unitGroupId = productWriteSeedRow('subul_units_groups', ['name' => 'Countable', 'author' => $authorId]);

    $unitId = productWriteSeedRow('subul_units', [
        'name' => 'Piece',
        'identifier' => 'piece-'.uniqid(),
        'author' => $authorId,
        'group_id' => $unitGroupId,
        'value' => 1,
        'base_unit' => 1,
    ]);

    $categoryId = productWriteSeedRow('subul_products_categories', ['name' => 'Misc', 'author' => $authorId]);
    $taxGroupId = productWriteSeedRow('subul_taxes_groups', ['name' => 'Default Tax Group']);

    return ['unitGroupId' => $unitGroupId, 'unitId' => $unitId, 'categoryId' => $categoryId, 'taxGroupId' => $taxGroupId];
}

/**
 * The ConfigForm payload contract — exactly what `buildCrudPayload` emits
 * for ProductCrud's `variations` root custom section.
 */
function productWritePayload(array $relations, array $overrides = []): array
{
    return array_merge([
        'name' => 'Test product',
        'variations' => [
            [
                '$primary' => true,
                'identification' => [
                    'category_id' => $relations['categoryId'],
                    'barcode' => '',
                    'sku' => '',
                    'barcode_type' => 'code128',
                    'type' => 'materialized',
                    'status' => 'available',
                    'stock_management' => 'enabled',
                    'description' => 'A product written through the crud shell.',
                ],
                'groups' => ['product_subitems' => []],
                'units' => [
                    'unit_group' => $relations['unitGroupId'],
                    'accurate_tracking' => false,
                    'auto_cogs' => true,
                    'selling_group' => [
                        [
                            'id' => '',
                            'unit_id' => $relations['unitId'],
                            'convert_unit_id' => '',
                            'quantity' => 0,
                            'sale_price_edit' => '10',
                            'wholesale_price_edit' => '7',
                            'cogs' => 0,
                            'low_quantity' => 0,
                            'stock_alert_enabled' => 0,
                            'visible' => 1,
                            'preview_url' => '',
                        ],
                    ],
                ],
                'expiracy' => ['expires' => false, 'on_expiration' => 'prevent_sales'],
                'taxes' => ['tax_group_id' => $relations['taxGroupId'], 'tax_type' => 'inclusive'],
                'images' => [['url' => 'https://example.com/img/one.png']],
            ],
        ],
    ], $overrides);
}

it('creates a product through the crud endpoint by delegating to ProductService', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $relations = productWriteSeedRelations($user->id);

    $response = $this->postJson('/api/crud/sb.products', productWritePayload($relations));

    $response->assertStatus(200);
    expect($response->json('status'))->toBe('success');

    $product = Product::where('name', 'Test product')->first();
    expect($product)->not->toBeNull();
    expect((int) $product->category_id)->toBe($relations['categoryId']);
    expect($product->product_type)->toBe('product');
    expect($product->type)->toBe('materialized');
    expect($product->stock_management)->toBe('enabled');
    expect((int) $product->author)->toBe($user->id);

    // empty barcode/sku auto-generate (ProductService, same as the dedicated endpoint)
    expect($product->barcode)->not->toBe('');
    expect($product->sku)->not->toBe('');

    // the selling-group row became the product's unit quantity (sale price through TaxService)
    $unitQuantity = ProductUnitQuantity::where('product_id', $product->id)->first();
    expect($unitQuantity)->not->toBeNull();
    expect((int) $unitQuantity->unit_id)->toBe($relations['unitId']);
    expect((float) $unitQuantity->sale_price)->toBeGreaterThan(0);

    // the gallery row was written by ProductService::saveGallery
    expect(DB::table('subul_products_galleries')->where('product_id', $product->id)->count())->toBe(1);

    // the response redirects to the products list (JSON contract for axios)
    expect($response->json('redirect'))->toBe(route('sb.dashboard.products'));
});

it('rejects a payload without a category with a flat category_id 422 error', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $relations = productWriteSeedRelations($user->id);
    $payload = productWritePayload($relations);
    $payload['variations'][0]['identification']['category_id'] = '';

    $response = $this->postJson('/api/crud/sb.products', $payload);

    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('category_id');

    expect(Product::where('name', 'Test product')->count())->toBe(0);
});

it('rejects a payload without selling groups with a units.selling_group 422 error', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $relations = productWriteSeedRelations($user->id);
    $payload = productWritePayload($relations);
    $payload['variations'][0]['units']['selling_group'] = [];

    $response = $this->postJson('/api/crud/sb.products', $payload);

    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('units.selling_group');

    expect(Product::where('name', 'Test product')->count())->toBe(0);
});

it('updates a product through the crud endpoint without touching its stock', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $relations = productWriteSeedRelations($user->id);

    // Seed the product + its unit quantity (the stock that must survive an edit).
    $productId = productWriteSeedRow('subul_products', [
        'name' => 'Stocked product',
        'barcode' => 'prd-'.uniqid(),
        'barcode_type' => 'code128',
        'sku' => 'sku-'.uniqid(),
        'type' => 'materialized',
        'stock_management' => 'enabled',
        'category_id' => $relations['categoryId'],
        'unit_group' => $relations['unitGroupId'],
        'tax_group_id' => $relations['taxGroupId'],
        'author' => $user->id,
    ]);

    $unitQuantityId = productWriteSeedRow('subul_products_unit_quantities', [
        'product_id' => $productId,
        'unit_id' => $relations['unitId'],
        'quantity' => 10,
        'sale_price' => 15,
        'sale_price_edit' => 15,
    ]);

    $payload = productWritePayload($relations, ['name' => 'Stocked product renamed']);
    $payload['variations'][0]['units']['selling_group'][0]['id'] = $unitQuantityId;
    $payload['variations'][0]['units']['selling_group'][0]['quantity'] = 10;
    $payload['variations'][0]['units']['selling_group'][0]['sale_price_edit'] = '12';

    $response = $this->putJson('/api/crud/sb.products/'.$productId, $payload);

    $response->assertStatus(200);
    expect($response->json('status'))->toBe('success');

    $product = Product::findOrFail($productId);
    expect($product->name)->toBe('Stocked product renamed');
    expect($product->description)->toBe('A product written through the crud shell.');

    // same unit quantity row, price updated, stock quantity untouched (ground rule 5)
    $unitQuantity = ProductUnitQuantity::findOrFail($unitQuantityId);
    expect((float) $unitQuantity->sale_price)->toBe(12.0);
    expect((float) $unitQuantity->quantity)->toBe(10.0);
    expect(ProductUnitQuantity::where('product_id', $productId)->count())->toBe(1);
});
