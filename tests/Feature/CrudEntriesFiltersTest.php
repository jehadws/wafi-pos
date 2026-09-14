<?php

/**
 * CRUD entries query-filters contract (tables toolbar filters fix).
 *
 * Pins the `CrudService::getEntries()` behavior the SPA toolbar relies on:
 *  - `daterangepicker` `endDate` applies as **end-of-day** — the SPA sends
 *    `Y-m-d` bounds, so a same-day range must match rows created during
 *    that day (a midnight comparison excluded the whole last day);
 *  - a declared `select` filter applies as a scalar `where`;
 *  - multiselect picks (arrays) apply as `whereIn` instead of crashing on
 *    the array operand;
 *  - joined-alias text filters (e.g. `customer.phone` with `operator: like`)
 *    resolve against the relation alias — the bare `phone` name was
 *    ambiguous across the two `subul_users` joins (customer + author).
 *
 * The generic seeder mirrors `CrudListScopingTest` (kept local to avoid
 * cross-file coupling).
 */

use App\Crud\OrderCrud;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;

function filtersSeedRow(string $table, array $overrides = []): int
{
    $row = [];

    /**
     * String columns participating in a UNIQUE index (e.g. subul_users.email)
     * need per-row values — the blank fill would collide on the second row.
     */
    $uniqueColumns = collect(Schema::getIndexes($table))
        ->filter(fn ($index) => $index['unique'])
        ->flatMap(fn ($index) => $index['columns'])
        ->unique()
        ->values()
        ->all();

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
            in_array($name, $uniqueColumns, true) => 'seed-' . uniqid() . '@seed.test',
            default => '',
        };
    }

    DB::table($table)->insert(array_merge($row, $overrides));

    return (int) DB::getPdo()->lastInsertId();
}

function filtersEntriesRequest(array $params): Request
{
    $request = Request::create('/api/crud/sb.orders', 'GET', $params);
    app()->instance('request', $request);

    return $request;
}

it('matches rows created during the last day of a daterangepicker filter', function () {
    Gate::before(fn () => true);

    $authorId = filtersSeedRow('subul_users');
    $customerId = filtersSeedRow('subul_users');

    $orderId = filtersSeedRow('subul_orders', [
        'author' => $authorId,
        'customer_id' => $customerId,
        'payment_status' => 'paid',
        'created_at' => now()->setTime(9, 0)->toDateTimeString(),
        'updated_at' => now()->setTime(9, 0)->toDateTimeString(),
    ]);

    $crud = new OrderCrud;

    // The wire shape the toolbar sends: Y-m-d bounds, same-day range.
    filtersEntriesRequest([
        'page' => 1,
        'per_page' => 20,
        'queryFilters' => urlencode(json_encode([
            'subul_orders.created_at' => [
                'startDate' => now()->format('Y-m-d'),
                'endDate' => now()->format('Y-m-d'),
            ],
        ])),
    ]);

    $entries = $crud->getEntries();

    expect($entries['total'])->toBe(1);
    expect($entries['data'][0]->id)->toBe($orderId);
});

it('applies a declared select filter as a scalar where', function () {
    Gate::before(fn () => true);

    $authorId = filtersSeedRow('subul_users');
    $customerId = filtersSeedRow('subul_users');

    $paidId = filtersSeedRow('subul_orders', [
        'author' => $authorId,
        'customer_id' => $customerId,
        'payment_status' => 'paid',
    ]);

    filtersSeedRow('subul_orders', [
        'author' => $authorId,
        'customer_id' => $customerId,
        'payment_status' => 'unpaid',
    ]);

    $crud = new OrderCrud;

    filtersEntriesRequest([
        'page' => 1,
        'per_page' => 20,
        'queryFilters' => urlencode(json_encode(['payment_status' => 'paid'])),
    ]);

    $entries = $crud->getEntries();

    expect($entries['total'])->toBe(1);
    expect($entries['data'][0]->id)->toBe($paidId);
});

it('applies multiselect picks as whereIn instead of crashing on the array operand', function () {
    Gate::before(fn () => true);

    $authorId = filtersSeedRow('subul_users');
    $customerId = filtersSeedRow('subul_users');

    $paidId = filtersSeedRow('subul_orders', [
        'author' => $authorId,
        'customer_id' => $customerId,
        'payment_status' => 'paid',
    ]);

    $holdId = filtersSeedRow('subul_orders', [
        'author' => $authorId,
        'customer_id' => $customerId,
        'payment_status' => 'hold',
    ]);

    filtersSeedRow('subul_orders', [
        'author' => $authorId,
        'customer_id' => $customerId,
        'payment_status' => 'unpaid',
    ]);

    $crud = new OrderCrud;

    filtersEntriesRequest([
        'page' => 1,
        'per_page' => 20,
        'queryFilters' => urlencode(json_encode(['payment_status' => ['paid', 'hold']])),
    ]);

    $entries = $crud->getEntries();

    expect($entries['total'])->toBe(2);
    expect(collect($entries['data'])->pluck('id')->sort()->values()->all())->toBe([$paidId, $holdId]);
});

it('applies a joined-alias text filter with its operator without an ambiguous column', function () {
    Gate::before(fn () => true);

    $authorId = filtersSeedRow('subul_users');
    $customerId = filtersSeedRow('subul_users', ['phone' => '555-0100']);

    $orderId = filtersSeedRow('subul_orders', [
        'author' => $authorId,
        'customer_id' => $customerId,
        'payment_status' => 'paid',
    ]);

    $crud = new OrderCrud;

    // The bare `phone` name was ambiguous (customer + author join the same
    // users table); the alias-qualified name resolves the customer row.
    filtersEntriesRequest([
        'page' => 1,
        'per_page' => 20,
        'queryFilters' => urlencode(json_encode(['customer.phone' => '555-0100'])),
    ]);

    $entries = $crud->getEntries();

    expect($entries['total'])->toBe(1);
    expect($entries['data'][0]->id)->toBe($orderId);
});
