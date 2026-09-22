<?php

use App\Classes\Hook;
use App\Models\Order;
use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use App\Services\CrudEntry;
use App\Services\CrudService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;

/**
 * Tables contract (T1.2) — generic seeding helpers.
 *
 * The schema does not declare database-level foreign keys, so the
 * seeders satisfy each CRUD's DECLARED relations instead: an INNER
 * JOIN would otherwise silently drop a seeded row.
 */
function crudFlattenRelations(array $relations): array
{
    $flat = [];

    foreach ($relations as $key => $relation) {
        $entries = is_string($key) ? (array) $relation : [$relation];

        foreach ($entries as $entry) {
            if (is_array($entry[0] ?? null)) {
                foreach ($entry as $nested) {
                    $flat[] = $nested;
                }
            } else {
                $flat[] = $entry;
            }
        }
    }

    return $flat;
}

function crudSeedRow(string $table, array $overrides = [], ?array &$memo = null, ?array &$stack = null, bool $memoize = true): int
{
    if ($memo === null) {
        $memo = [];
    }

    if ($stack === null) {
        $stack = [];
    }

    /**
     * The cycle guard is ALWAYS active (top-level callers pass
     * memoize=false to force a fresh insert, but mutual relation
     * chains must still be detected). Only the memo-return is
     * conditional on $memoize.
     */
    if ($memoize && isset($memo[$table])) {
        return $memo[$table];
    }

    if (in_array($table, $stack, true)) {
        throw new RuntimeException("Cyclic relation detected while seeding [{$table}]");
    }

    if (count($memo) > 80) {
        throw new RuntimeException("Seed recursion guard hit while seeding [{$table}]");
    }

    $stack[] = $table;
    $tracked = true;

    try {
        $row = [];

        foreach (Schema::getColumns($table) as $column) {
            $name = $column['name'];

            if ($name === 'id' || array_key_exists($name, $overrides)) {
                continue;
            }

            if ($column['nullable']) {
                continue;
            }

            $type = strtolower((string) $column['type']);
            $default = $column['default'];

            if ($default !== null) {
                $default = (string) $default;

                $row[$name] = match (true) {
                    preg_match('/^current_timestamp/i', $default) === 1 => now()->toDateTimeString(),
                    str_contains($type, 'int') && is_numeric($default) => (int) $default,
                    default => trim($default, "'"),
                };

                continue;
            }

            $row[$name] = match (true) {
                str_contains($type, 'int') || str_contains($type, 'decimal') || str_contains($type, 'float') || str_contains($type, 'double') => 0,
                str_contains($type, 'datetime') || str_contains($type, 'timestamp') => now()->toDateTimeString(),
                default => '',
            };
        }

        DB::table($table)->insert(array_merge($row, $overrides));

        return $memo[$table] = (int) DB::getPdo()->lastInsertId();
    } finally {
        if ($tracked) {
            array_pop($stack);
        }
    }
}

/**
 * Builds the column values required by the relations declared on the
 * CRUD, so INNER JOINs keep the seeded row visible on the list.
 * `$relationMap` maps every CRUD table to its declared relations so
 * parent rows can be seeded relation-aware as well.
 */
function crudRelationOverrides(array $relationMap, string $table, array &$memo, array &$stack): array
{
    $baseTable = Hook::filter('sb-model-table', $table);
    $overrides = [];

    foreach (crudFlattenRelations($relationMap[$table] ?? []) as $relation) {
        if (! is_array($relation) || count($relation) < 4 || ! is_string($relation[0]) || ! is_string($relation[1]) || ! is_string($relation[3])) {
            continue;
        }

        /**
         * The base-table FK may be declared on either side of the
         * join (OrderCrud declares "subul_orders.author = author.id").
         */
        $baseParts = collect([$relation[1], $relation[3]])
            ->map(fn ($side) => explode('.', $side))
            ->first(fn ($parts) => count($parts) === 2 && Hook::filter('sb-model-table', trim($parts[0])) === $baseTable);

        if ($baseParts === null) {
            continue;
        }

        $relatedTable = Hook::filter('sb-model-table', trim(explode(' as ', $relation[0])[0]));
        $parentId = DB::table($relatedTable)->value('id');

        /**
         * The cycle guard MUST run here, before the recursive
         * crudRelationOverrides() call is evaluated — mutual
         * relation chains (products <-> categories) would otherwise
         * recurse infinitely without ever reaching crudSeedRow's
         * own stack check.
         */
        if ($parentId === null && ! in_array($relatedTable, $stack, true)) {
            try {
                $stack[] = $relatedTable;
                $childOverrides = crudRelationOverrides($relationMap, $relatedTable, $memo, $stack);
                array_pop($stack);
                $parentId = crudSeedRow($relatedTable, $childOverrides, $memo, $stack);
            } catch (Throwable) {
                array_pop($stack);

                continue;
            }
        }

        $overrides[trim($baseParts[1])] = $parentId ?? 0;
    }

    return $overrides;
}

function crudEnsureRow(string $table, array $relationMap, array &$memo): int
{
    $existing = DB::table($table)->value('id');

    if ($existing !== null) {
        return (int) $existing;
    }

    $stack = [];

    return crudSeedRow($table, crudRelationOverrides($relationMap, $table, $memo, $stack), $memo, $stack, false);
}

it('returns a well-formed paginator whose rows carry well-formed actions across all crud resources', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    /**
     * DateService (entry casts) resolves the language from the
     * authenticated user's attribute row — production users always
     * carry one, so seed it for the acting user.
     */
    DB::table('subul_users_attributes')->insert(['user_id' => $user->id]);

    $crudFiles = File::files(app_path('Crud'));
    expect($crudFiles)->toHaveCount(37);

    /**
     * sb.customers lists users carrying the store-customer role
     * (CustomerCrud::hook joins the role relations) — the role is
     * already seeded by the core migrations, so link a user to it.
     */
    $customerRole = Role::where('namespace', Role::STORECUSTOMER)->firstOrFail();
    $linkedCustomer = User::factory()->create(['author' => $user->id]);
    DB::table('subul_users_roles_relations')->insert([
        'user_id' => $linkedCustomer->id,
        'role_id' => $customerRole->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    /**
     * Rows that must exist for hook-constrained CRUDs
     * (e.g. HoldOrderCrud filters on payment_status).
     */
    $requiredRows = [
        'subul_orders' => [
            ['payment_status' => Order::PAYMENT_HOLD],
            ['payment_status' => Order::PAYMENT_UNPAID],
            ['payment_status' => Order::PAYMENT_PARTIALLY],
        ],
    ];

    /**
     * Maps every CRUD table to its declared relations so the seeders
     * can satisfy INNER JOINs on parent tables as well.
     */
    $relationMap = [];

    foreach ($crudFiles as $file) {
        $relationClassName = 'App\\Crud\\' . $file->getFilenameWithoutExtension();
        $relationResource = new $relationClassName;
        $reflection = new ReflectionClass($relationResource);
        $relationTable = Hook::filter('sb-model-table', (string) ($reflection->getProperty('table')->getValue($relationResource) ?: ''));

        /**
         * Several CRUDs can share the same base table with different
         * relation sets (e.g. CouponOrderHistoryCrud and
         * CustomerCouponHistoryCrud on subul_orders_coupons) — merge
         * them so seeded rows satisfy every join variant.
         */
        if ($relationTable !== '') {
            $relationMap[$relationTable] = array_merge($relationMap[$relationTable] ?? [], $relationResource->getRelations());
        }
    }

    /**
     * CRUDs whose list only resolves with specific query params
     * (mirrors the real usage of each resource hook()). The FK is
     * also forced onto a seeded row so the param filter matches it.
     */
    $listParams = [
        'sb.customers-rewards' => ['parent' => 'subul_users', 'fk' => 'customer_id', 'param' => 'customer_id'],
        'sb.customers-account-history' => ['parent' => 'subul_users', 'fk' => 'customer_id', 'param' => 'customer_id'],
        'sb.customers-coupons-history' => ['parent' => 'subul_customers_coupons', 'fk' => 'customer_coupon_id', 'param' => 'customer_coupon_id'],
        'sb.coupons-orders-history' => ['parent' => 'subul_coupons', 'fk' => 'coupon_id', 'param' => 'coupon_id'],
        'sb.providers-procurements' => ['parent' => 'subul_providers', 'fk' => 'provider_id', 'param' => 'provider_id'],
        'sb.providers-products' => ['parent' => 'subul_procurements', 'fk' => 'procurement_id', 'param' => 'procurements'],
    ];

    foreach ($crudFiles as $file) {
        $className = 'App\\Crud\\' . $file->getFilenameWithoutExtension();
        expect(class_exists($className))->toBeTrue();

        /** @var CrudService $resource */
        $resource = new $className;
        $namespace = $resource->getNamespace();
        $modelClass = $resource->getModel();
        $memo = [];
        $stack = [];

        $reflection = new ReflectionClass($resource);
        $table = Hook::filter('sb-model-table', (string) ($reflection->getProperty('table')->getValue($resource) ?: ($modelClass ? (new $modelClass)->getTable() : '')));

        if ($table !== '') {
            foreach ($requiredRows[$table] ?? [] as $overrides) {
                $checkColumn = array_key_first($overrides);

                if (! DB::table($table)->where($checkColumn, $overrides[$checkColumn])->exists()) {
                    crudSeedRow($table, array_merge(crudRelationOverrides($relationMap, $table, $memo, $stack), $overrides), $memo, $stack, false);
                }
            }

            if (DB::table($table)->count() === 0) {
                $seeded = false;

                if (! empty($modelClass) && class_exists($modelClass)) {
                    $modelTable = Hook::filter('sb-model-table', (new $modelClass)->getTable());

                    if ($modelTable === $table) {
                        try {
                            $modelClass::factory()->create();
                            $seeded = true;
                        } catch (Throwable) {
                            $seeded = false;
                        }
                    }
                }

                if (! $seeded) {
                    crudSeedRow($table, crudRelationOverrides($relationMap, $table, $memo, $stack), $memo, $stack, false);
                }
            }
        }

        $requestParams = [];

        if (($listParam = $listParams[$namespace] ?? null) !== null) {
            $parentId = crudEnsureRow($listParam['parent'], $relationMap, $memo);

            /**
             * Make sure at least one row carries the exact FK value the
             * query param filter (hook()) matches on.
             */
            if (DB::table($table)->where($listParam['fk'], $parentId)->doesntExist()) {
                crudSeedRow($table, array_merge(crudRelationOverrides($relationMap, $table, $memo, $stack), [$listParam['fk'] => $parentId]), $memo, $stack, false);
            }

            $requestParams = [$listParam['param'] => (string) $parentId];
        }

        $this->app->instance(
            'request',
            Request::create('/api/crud/' . $namespace, 'GET', $requestParams)
        );

        $entries = $resource->getEntries();

        // 1. Paginator shape
        foreach (['current_page', 'data', 'total', 'per_page', 'last_page'] as $paginatorKey) {
            expect(array_key_exists($paginatorKey, $entries))->toBeTrue("Paginator is missing [{$paginatorKey}] in {$className}");
        }

        expect($entries['total'] > 0)->toBeTrue("No rows could be seeded for [{$table}] — entry actions contract cannot be verified for {$className} [rows: " . json_encode(DB::table($table)->get()) . "] [orders: " . json_encode(DB::table('subul_orders')->get()) . "]");

        // 2. Row contract
        foreach ($entries['data'] as $row) {
            /** @var CrudEntry $row */
            $serialized = $row->toArray();

            $actions = $serialized['$actions'] ?? [];
            expect(is_array($actions))->toBeTrue("Row actions must be an array in {$className}");

            foreach ($actions as $identifier => $action) {
                foreach (['label', 'identifier', 'url', 'confirm', 'type', 'permissions'] as $actionKey) {
                    expect(array_key_exists($actionKey, $action))->toBeTrue("Action [{$identifier}] is missing [{$actionKey}] in {$className}");
                }

                expect($action['label'])->toBeString("Action [{$identifier}] label must be a string in {$className}");
                expect(strip_tags((string) $action['label']) === (string) $action['label'])->toBeTrue("Action [{$identifier}] label must not contain raw HTML in {$className}");
                expect($action['identifier'])->toBe($identifier, "Action [{$identifier}] identifier mismatch in {$className}");
                expect(is_array($action['permissions']))->toBeTrue("Action [{$identifier}] permissions must be an array in {$className}");
                expect(in_array($action['type'], ['GOTO', 'DELETE', 'GET', 'POPUP'], true))->toBeTrue("Action [{$identifier}] carries an unexpected type [{$action['type']}] in {$className}");

                if (in_array($action['type'], ['GOTO', 'GET', 'DELETE'], true)) {
                    expect($action['url'])->toBeString("Action [{$identifier}] of type [{$action['type']}] must carry a string url in {$className}");
                    expect($action['url'] !== '')->toBeTrue("Action [{$identifier}] of type [{$action['type']}] must carry a non-empty url in {$className}");
                }

                if ($action['confirm'] !== null) {
                    expect(is_array($action['confirm']))->toBeTrue("Action [{$identifier}] confirm must be an array in {$className}");
                    expect($action['confirm']['message'] ?? null)->toBeString("Action [{$identifier}] confirm.message must be a string in {$className}");

                    if (($action['confirm']['title'] ?? null) !== null) {
                        expect($action['confirm']['title'])->toBeString("Action [{$identifier}] confirm.title must be a string in {$className}");
                    }
                }
            }

            if (isset($serialized['$cssClass'])) {
                expect($serialized['$cssClass'])->toBeString("\$cssClass must be a string in {$className}");
            }
        }
    }
});

it('strips entry actions the current user has no permission for', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    DB::table('subul_users_attributes')->insert(['user_id' => $user->id]);

    /**
     * Generic seeder: UnitFactory does not cover the NOT NULL
     * identifier/group_id columns, and no FK constraint applies.
     */
    $memo = [];
    crudSeedRow('subul_units', [], $memo);

    $crud = new class extends CrudService
    {
        protected $table = 'subul_units';

        protected $namespace = 'sb.units';

        protected $model = Unit::class;

        protected function setActions(CrudEntry $entry): CrudEntry
        {
            $entry->action(
                label: __('Delete'),
                identifier: 'delete',
                url: sb()->url('/api/crud/sb.units/' . $entry->id),
                type: 'DELETE',
                permissions: ['subul.delete.units'],
            );

            return $entry;
        }
    };

    /**
     * Without any permission grant, Gate::allows fails for the unknown
     * ability and the backend must strip the action server-side.
     */
    $row = $crud->getEntries()['data'][0];
    expect($row->toArray()['$actions'])->toBeEmpty();

    /**
     * With the permission granted (Gate::before stub), the action must
     * be exposed with its permission definition intact.
     */
    Gate::before(fn () => true);

    $row = $crud->getEntries()['data'][0];
    $actions = $row->toArray()['$actions'];

    expect($actions)->toHaveKey('delete');
    expect($actions['delete']['permissions'])->toBe(['subul.delete.units']);
    expect($actions['delete']['type'])->toBe('DELETE');
    expect($actions['delete']['url'])->toBeString();
});