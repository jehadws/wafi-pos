<?php

/**
 * Phase 5 (docs/plans/backend-driven-completion/05): `ProductCrud::getForm`
 * emits the declarative root custom section — `{ main, variations: { component,
 * value, tabs, unitGroups } }` — that the `productVariations` registry
 * component consumes, plus the write delegation contract (disablePost/
 * disablePut + beforePost/beforePut → ProductService, getFlatForm reshaping
 * `variations` into the exact payload ProductService::create/update consume).
 */

use App\Crud\ProductCrud;
use App\Models\Product;
use App\Models\User;
use App\Services\ProductService;
use Illuminate\Support\Facades\Gate;

it('emits a declarative root custom section with the authored variation tabs', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $crud = new ProductCrud();
    $form = $crud->getForm();

    // 1. Root shape: main + the `variations` custom section
    expect($form)->toBeArray();
    expect($form)->toHaveKeys(['main', 'variations']);
    expect($form['main']['name'])->toBe('name');

    $section = $form['variations'];
    expect($section)->toBeArray();
    expect($section['component'])->toBe('productVariations');
    expect($section['tabs'])->toHaveKeys(['identification', 'groups', 'units', 'expiracy', 'taxes', 'images']);
    expect($section['tabs']['groups']['component'])->toBe('sbProductGroup');

    // 2. The unit groups-with-units list rides the section (client-side refilter)
    expect($section['unitGroups'])->toBeInstanceOf(Illuminate\Support\Collection::class);

    // 3. The section value seeds a single $primary variation row with the
    //    authored defaults (create flow, no entry)
    $primary = $section['value'][0] ?? null;
    expect($primary)->toBeArray();
    expect($primary['$primary'])->toBeTrue();
    expect($primary['identification'])->toHaveKeys([
        'category_id', 'barcode', 'barcode_type', 'sku', 'type', 'status', 'stock_management', 'description',
    ]);
    expect($primary['units'])->toHaveKeys(['unit_group', 'accurate_tracking', 'auto_cogs', 'selling_group']);
    expect($primary['units']['selling_group'])->toBeArray();
    expect($primary['groups'])->toHaveKey('product_subitems');
    expect($primary['expiracy'])->toHaveKeys(['expires', 'on_expiration']);
    expect($primary['taxes'])->toHaveKeys(['tax_group_id', 'tax_type']);
    expect($primary['images'])->toBeArray();

    // 4. Clean JSON serialization (no Closures leak into the payload)
    expect(json_encode($form))->not->toBeFalse();
});

it('hydrates the section value from the product on edit', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    // ProductFactory picks a random UnitGroup and the first TaxGroup.
    \App\Models\UnitGroup::factory()->create();
    \App\Models\TaxGroup::factory()->create();

    $product = Product::factory()->create([
        'name' => 'Edit me',
        'type' => 'materialized',
        'stock_management' => 'enabled',
    ]);

    $form = (new ProductCrud())->getForm($product);
    $primary = $form['variations']['value'][0];

    expect($primary['identification']['category_id'])->toBe($product->category_id ?? '');
    expect($primary['identification']['type'])->toBe('materialized');
    expect($primary['identification']['status'])->toBe($product->status ?? 'available');
    expect($primary['units']['unit_group'])->toBe($product->unit_group ?? \App\Models\UnitGroup::first()->id);
    expect($primary['expiracy']['expires'])->toBe($product->expires ?? false);
});

it('extracts flat payload validation rules and delegates writes to ProductService', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $crud = new ProductCrud();

    // Flat keys — the crud write path flattens `variations` through
    // getFlatForm before ProductRequest::rules() run in beforePost/beforePut.
    $rules = collect(\Illuminate\Support\Arr::dot($crud->extractProductValidaton()))->keys()->all();

    expect($rules)->toContain('name');
    expect($rules)->toContain('category_id');
    expect($rules)->toContain('barcode_type');
    expect($rules)->toContain('type');
    expect($rules)->toContain('status');
    expect($rules)->toContain('stock_management');
    expect($rules)->toContain('units.unit_group');
    expect($rules)->toContain('units.selling_group.*.unit_id');
    expect($rules)->toContain('units.selling_group.*.convert_unit_id');
    expect($rules)->toContain('units.selling_group.*.sale_price_edit');
    expect($rules)->toContain('units.selling_group.*.wholesale_price_edit');

    // Write delegation: nothing may write through the generic fill/save block.
    expect($crud->disablePost)->toBeTrue();
    expect($crud->disablePut)->toBeTrue();
    expect($crud->skippable)->toContain('variations');
    expect($crud->to_route)->toBe('sb.dashboard.products');
});

it('flattens the ConfigForm variations payload into the ProductService shape', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $spy = Mockery::mock(ProductService::class)->makePartial();
    $spy->shouldReceive('create')->once()->withArgs(function ($payload) {
        // The exact flat shape saveProduct used to hand-build for the service.
        expect($payload['name'])->toBe('Flat product');
        expect($payload['product_type'])->toBe('product');
        expect($payload['category_id'])->toBe(5);
        expect($payload['barcode_type'])->toBe('code128');
        expect($payload['tax_type'])->toBe('inclusive');
        expect($payload['units']['selling_group'])->toBe([[
            'id' => '',
            'unit_id' => 2,
            'convert_unit_id' => '',
            'quantity' => 0,
            'sale_price_edit' => '10',
            'wholesale_price_edit' => '7',
        ]]);
        expect($payload['units']['accurate_tracking'])->toBeFalse();
        expect($payload['groups']['product_subitems'])->toBe([]);
        expect($payload['images'])->toBe([]);

        // flatArrayWithKeys drops `false` leaves — the long-standing quirk the
        // dedicated endpoints shared (expires only reaches the service when true).
        expect($payload)->not->toHaveKey('expires');

        return true;
    });

    $this->app->instance(ProductService::class, $spy);

    $crud = new ProductCrud();
    $flat = $crud->getFlatForm([
        'name' => 'Flat product',
        'variations' => [
            [
                '$primary' => true,
                'identification' => [
                    'category_id' => 5,
                    'barcode' => '',
                    'sku' => '',
                    'barcode_type' => 'code128',
                    'type' => 'materialized',
                    'status' => 'available',
                    'stock_management' => 'enabled',
                    'description' => '',
                ],
                'groups' => ['product_subitems' => []],
                'units' => [
                    'unit_group' => 1,
                    'accurate_tracking' => false,
                    'auto_cogs' => true,
                    'selling_group' => [[
                        'id' => '',
                        'unit_id' => 2,
                        'convert_unit_id' => '',
                        'quantity' => 0,
                        'sale_price_edit' => '10',
                        'wholesale_price_edit' => '7',
                    ]],
                ],
                'expiracy' => ['expires' => false, 'on_expiration' => 'prevent_sales'],
                'taxes' => ['tax_group_id' => '', 'tax_type' => 'inclusive'],
                'images' => [],
            ],
        ],
    ]);

    $crud->beforePost($flat);
});
