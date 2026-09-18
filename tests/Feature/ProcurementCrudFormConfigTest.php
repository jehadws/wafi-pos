<?php

/**
 * Phase 1 (docs/plans/backend-driven-completion/01): ProcurementCrud::getForm
 * is authored — main `name` + a `general` tab reproducing the hand
 * create/edit page fields (copied from app/Forms/procurement/general.php,
 * with delivery_status extended with `draft` per ProcurementRequest) plus a
 * root-level `products` section (procurementProducts custom-field config,
 * rows seeded under `value` on edit). This pins the config contract the
 * generic crud/form shell — and the Phase 2 procurementProducts field —
 * consume.
 */

use App\Crud\ProcurementCrud;
use App\Models\Procurement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;

/**
 * Minimal schema-aware seeder (same approach as CrudListScopingTest, kept
 * local to avoid cross-file coupling): fills NOT NULL columns without
 * defaults so the inserts satisfy the strictest schema.
 */
function procurementFormSeedRow(string $table, array $overrides = []): int
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

it('authors the procurement form with main name, the 7 general fields and a products section', function () {
    Gate::before(fn () => true);

    $this->actingAs(User::factory()->create());

    $form = ProcurementCrud::getFormConfig()['form'];

    // main — the procurement name, hand-page copy
    expect($form['main']['name'])->toBe('name');
    expect($form['main']['type'])->toBe('text');
    expect($form['main']['validation'])->toBe('nullable|string|max:255');
    expect($form['main']['description'])->toBe(__('Provide a name that will help to identify the procurement.'));

    // the tab identifier is the payload key ProcurementService expects
    expect($form['tabs']['general']['identifier'])->toBe('general');

    $fields = collect($form['tabs']['general']['fields'])->keyBy(fn ($field) => $field['name']);

    expect($fields->keys()->toArray())->toBe([
        'invoice_reference',
        'delivery_time',
        'invoice_date',
        'automatic_approval',
        'delivery_status',
        'payment_status',
        'provider_id',
    ]);

    expect($fields['invoice_reference']['type'])->toBe('text');
    expect($fields['invoice_reference']['validation'])->toBe('nullable|string|max:255');

    expect($fields['delivery_time']['type'])->toBe('date');
    expect($fields['delivery_time']['value'])->toBe(sb()->date->now()->format('Y-m-d'));

    expect($fields['invoice_date']['type'])->toBe('date');
    expect($fields['invoice_date']['value'])->toBe(sb()->date->now()->format('Y-m-d'));

    expect($fields['automatic_approval']['type'])->toBe('switch');
    expect($fields['automatic_approval']['value'])->toBe(1);
    expect($fields['automatic_approval']['validation'])->toBe('nullable|boolean');
    expect($fields['automatic_approval']['options'])->toBe([
        ['label' => 'No', 'value' => 0],
        ['label' => 'Yes', 'value' => 1],
    ]);

    // ProcurementRequest is authoritative: draft included
    expect($fields['delivery_status']['type'])->toBe('select');
    expect($fields['delivery_status']['validation'])->toBe('required|in:delivered,pending,draft');
    expect($fields['delivery_status']['options'])->toBe([
        ['label' => 'Pending', 'value' => 'pending'],
        ['label' => 'Delivered', 'value' => 'delivered'],
        ['label' => 'Draft', 'value' => 'draft'],
    ]);

    expect($fields['payment_status']['type'])->toBe('select');
    expect($fields['payment_status']['validation'])->toBe('required|in:unpaid,paid');
    expect($fields['payment_status']['options'])->toBe([
        ['label' => 'Unpaid', 'value' => 'unpaid'],
        ['label' => 'Paid', 'value' => 'paid'],
    ]);

    expect($fields['provider_id']['type'])->toBe('search-select');
    expect($fields['provider_id']['component'])->toBe('sbCrudForm');
    expect($fields['provider_id']['validation'])->toBe('required');
    expect($fields['provider_id']['props'])->toHaveKey('namespace', 'sb.providers');

    // field names unique across main + general (contract-test rule)
    $names = collect([$form['main']])->merge($form['tabs']['general']['fields'])->pluck('name')->toArray();
    expect(count($names))->toBe(count(array_unique($names)));

    // root-level products section (create: no seeded rows)
    expect($form['products']['component'])->toBe('procurementProducts');
    expect($form['products']['taxGroups'])->toBeArray();
    expect($form['products']['value'])->toBe([]);
});

it('seeds the products rows from the procurement products on edit', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $providerId = procurementFormSeedRow('subul_providers', ['first_name' => 'John', 'last_name' => 'Doe']);

    $procurementId = procurementFormSeedRow('subul_procurements', [
        'name' => 'Seeded procurement',
        'provider_id' => $providerId,
        'author' => $user->id,
        'delivery_status' => 'pending',
        'payment_status' => 'unpaid',
    ]);

    $procurementProductId = procurementFormSeedRow('subul_procurements_products', [
        'name' => 'Seeded product',
        'procurement_id' => $procurementId,
        'quantity' => 5,
        'available_quantity' => 5,
        'purchase_price' => 10,
        'total_purchase_price' => 50,
        'product_id' => 1,
        'unit_id' => 1,
    ]);

    $entry = Procurement::findOrFail($procurementId);

    $form = (new ProcurementCrud)->getForm($entry);

    expect($form['products']['component'])->toBe('procurementProducts');
    expect($form['products']['value'])->toHaveCount(1);

    $row = $form['products']['value'][0];
    expect($row['id'])->toBe($procurementProductId);
    expect($row['procurement_id'])->toBe($procurementId);
    expect($row['product_id'])->toBe(1);
    expect($row['unit_id'])->toBe(1);
    expect((float) $row['quantity'])->toBe(5.0);
    expect($row['name'])->toBe('Seeded product');

    // header fields hydrate from the entry
    $fields = collect($form['tabs']['general']['fields'])->keyBy(fn ($field) => $field['name']);
    expect($fields['provider_id']['value'])->toBe($providerId);
    expect($fields['delivery_status']['value'])->toBe('pending');
    expect($fields['payment_status']['value'])->toBe('unpaid');
    expect($form['main']['value'])->toBe('Seeded procurement');
});

it('seeds tax groups (with their taxes) into the products section', function () {
    Gate::before(fn () => true);

    $this->actingAs(User::factory()->create());

    $taxGroupId = procurementFormSeedRow('subul_taxes_groups', ['name' => 'VAT']);

    procurementFormSeedRow('subul_taxes', [
        'name' => 'VAT 10%',
        'rate' => 10,
        'tax_group_id' => $taxGroupId,
    ]);

    $form = (new ProcurementCrud)->getForm();

    expect($form['products']['taxGroups'])->toHaveCount(1);
    expect($form['products']['taxGroups'][0]['id'])->toBe($taxGroupId);
    expect($form['products']['taxGroups'][0]['taxes'])->toHaveCount(1);
    expect((float) $form['products']['taxGroups'][0]['taxes'][0]['rate'])->toBe(10.0);
});
