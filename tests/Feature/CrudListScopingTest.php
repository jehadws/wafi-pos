<?php

/**
 * Sub-list scoping contract (Phase 5 T5.1 finding).
 *
 * The SPA sends sub-list scoping keys INSIDE the `queryFilters` JSON
 * (`use-crud-table` merges `initialQuery` into that object), while every
 * sub-list `hook()` reads them through `request()->query()`. These tests
 * pin the `CrudService::getEntries()` behavior that makes both channels
 * agree:
 *  - undeclared, non-empty queryFilters keys are merged into the request
 *    query bag BEFORE hook() runs — an unguarded hook therefore scopes
 *    correctly instead of adding a conflicting `is null` where;
 *  - array-valued scopes (e.g. `procurements` on `sb.providers-products`)
 *    apply as `whereIn` in the JSON branch (a plain `where` would crash
 *    on the array operand);
 *  - standalone (Blade-era) query-param calls keep scoping unchanged.
 */

use App\Crud\ProviderProcurementsCrud;
use App\Crud\ProviderProductsCrud;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;

/**
 * Minimal schema-aware seeder: fills NOT NULL columns without defaults so
 * the inserts satisfy the strictest schema (mirrors the approach of the
 * generic contract-test seeder, kept local to avoid cross-file coupling).
 */
function scopingSeedRow(string $table, array $overrides = []): int
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

function scopingEntriesRequest(array $params): Request
{
    $request = Request::create('/api/crud/sb.providers-procurements', 'GET', $params);
    app()->instance('request', $request);

    return $request;
}

it('scopes sub-list entries when the SPA sends scoping keys inside queryFilters JSON', function () {
    Gate::before(fn () => true);

    $authorId = scopingSeedRow('subul_users');
    $providerId = scopingSeedRow('subul_providers');
    $otherProviderId = scopingSeedRow('subul_providers');

    $scopedId = scopingSeedRow('subul_procurements', [
        'name' => 'Scoped procurement',
        'provider_id' => $providerId,
        'author' => $authorId,
    ]);

    scopingSeedRow('subul_procurements', [
        'name' => 'Other procurement',
        'provider_id' => $otherProviderId,
        'author' => $authorId,
    ]);

    $crud = new ProviderProcurementsCrud;

    // The wire shape `use-crud-table` sends: scoping INSIDE the JSON.
    scopingEntriesRequest([
        'page' => 1,
        'per_page' => 20,
        'queryFilters' => urlencode(json_encode(['provider_id' => (string) $providerId])),
    ]);

    $entries = $crud->getEntries();

    expect($entries['total'])->toBe(1);
    expect($entries['data'][0]->id)->toBe($scopedId);
});

it('keeps standalone query-param scoping working', function () {
    Gate::before(fn () => true);

    $authorId = scopingSeedRow('subul_users');
    $providerId = scopingSeedRow('subul_providers');

    scopingSeedRow('subul_procurements', [
        'name' => 'Scoped procurement',
        'provider_id' => $providerId,
        'author' => $authorId,
    ]);

    $crud = new ProviderProcurementsCrud;

    scopingEntriesRequest([
        'page' => 1,
        'per_page' => 20,
        'provider_id' => (string) $providerId,
    ]);

    $entries = $crud->getEntries();

    expect($entries['total'])->toBe(1);
});

it('applies array-valued scopes through the resource hook without crashing the entries query', function () {
    Gate::before(fn () => true);

    $taxGroupId = scopingSeedRow('subul_taxes_groups');
    $authorId = scopingSeedRow('subul_users');
    $providerId = scopingSeedRow('subul_providers');

    $procurementId = scopingSeedRow('subul_procurements', [
        'name' => 'Procurement',
        'provider_id' => $providerId,
        'author' => $authorId,
    ]);

    $otherProcurementId = scopingSeedRow('subul_procurements', [
        'name' => 'Other procurement',
        'provider_id' => $providerId,
        'author' => $authorId,
    ]);

    scopingSeedRow('subul_procurements_products', [
        'name' => 'Scoped product',
        'procurement_id' => $procurementId,
        'tax_group_id' => $taxGroupId,
    ]);

    scopingSeedRow('subul_procurements_products', [
        'name' => 'Unscoped product',
        'procurement_id' => $otherProcurementId,
        'tax_group_id' => $taxGroupId,
    ]);

    $crud = new ProviderProductsCrud;

    // Array scope — the shape `listProvidersProducts` passes as queryParams.
    scopingEntriesRequest([
        'page' => 1,
        'per_page' => 20,
        'queryFilters' => urlencode(json_encode(['procurements' => [(string) $procurementId]])),
    ]);

    $entries = $crud->getEntries();

    expect($entries['total'])->toBe(1);
    expect($entries['data'][0]->name)->toBe('Scoped product');
});
