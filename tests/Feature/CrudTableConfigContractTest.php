<?php

use App\Http\Controllers\Dashboard\CrudController;
use App\Models\User;
use App\Services\CrudService;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;

function assertNoClosuresInTableConfig(mixed $data, string $path = ''): void
{
    if ($data instanceof \Closure) {
        test()->fail("Found Closure at path: {$path}");
    }
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            assertNoClosuresInTableConfig($value, $path === '' ? (string) $key : "{$path}.{$key}");
        }
    }
}

it('serializes the table config contract across all registered CRUD resources', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $crudFiles = File::files(app_path('Crud'));
    expect($crudFiles)->toHaveCount(37);

    $controller = app(CrudController::class);

    foreach ($crudFiles as $file) {
        $className = 'App\\Crud\\' . $file->getFilenameWithoutExtension();
        expect(class_exists($className))->toBeTrue();
        expect(is_subclass_of($className, CrudService::class))->toBeTrue();

        /** @var CrudService $resource */
        $resource = new $className;
        $namespace = $resource->getNamespace();

        /**
         * Build the config through the exact path used by
         * GET /api/crud/{ns}/config (CrudController@getConfig)
         * so the contract survives the getTableConfig extraction.
         */
        $config = $controller->getConfig($namespace);

        // 1. Verify required keys
        $requiredKeys = ['columns', 'queryFilters', 'labels', 'links', 'bulkActions', 'prependOptions', 'showOptions', 'showCheckboxes', 'headerButtons', 'namespace'];
        foreach ($requiredKeys as $key) {
            expect(array_key_exists($key, $config))->toBeTrue("Missing key [{$key}] in {$className}");
        }

        expect($config['namespace'])->toBe($namespace);
        expect($config['prependOptions'])->toBeBool();
        expect($config['showOptions'])->toBeBool();
        expect($config['showCheckboxes'])->toBeBool();

        // 2. Every column entry has a string label and boolean-coercible $sort / $direction
        expect($config['columns'])->toBeArray("Columns must be an array in {$className}");
        foreach ($config['columns'] as $columnName => $column) {
            expect(is_array($column))->toBeTrue("Column [{$columnName}] must be an array in {$className}");
            expect(array_key_exists('label', $column))->toBeTrue("Column [{$columnName}] is missing a label in {$className}");
            expect($column['label'])->toBeString("Column [{$columnName}] label must be a string in {$className}");
            expect(array_key_exists('$sort', $column))->toBeTrue("Column [{$columnName}] is missing \$sort in {$className}");
            expect(is_scalar($column['$sort']))->toBeTrue("Column [{$columnName}] \$sort must be boolean-coercible in {$className}");
            expect(array_key_exists('$direction', $column))->toBeTrue("Column [{$columnName}] is missing \$direction in {$className}");
            expect(is_scalar($column['$direction']))->toBeTrue("Column [{$columnName}] \$direction must be boolean-coercible in {$className}");
        }

        // 3. Every bulk action carries label + identifier (url optional)
        expect($config['bulkActions'])->toBeArray("Bulk actions must be an array in {$className}");
        foreach ($config['bulkActions'] as $index => $bulkAction) {
            expect(is_array($bulkAction))->toBeTrue("Bulk action [{$index}] must be an array in {$className}");
            expect(array_key_exists('label', $bulkAction))->toBeTrue("Bulk action [{$index}] is missing a label in {$className}");
            expect($bulkAction['label'])->toBeString("Bulk action [{$index}] label must be a string in {$className}");
            expect(array_key_exists('identifier', $bulkAction))->toBeTrue("Bulk action [{$index}] is missing an identifier in {$className}");
            expect($bulkAction['identifier'])->toBeString("Bulk action [{$index}] identifier must be a string in {$className}");
        }

        // 4. Links serialize to { type: 'link', href, label } (CrudLink)
        $serializedLinks = json_decode(json_encode($config['links']), true);
        expect($serializedLinks)->toBeArray("Links must serialize to an array in {$className}");
        foreach ($serializedLinks as $index => $link) {
            expect(is_array($link))->toBeTrue("Link [{$index}] must serialize to an array in {$className}");
            expect(($link['type'] ?? null) === 'link')->toBeTrue("Link [{$index}] must serialize with type 'link' in {$className}");
            expect($link['href'] ?? null)->toBeString("Link [{$index}] must carry a string href in {$className}");
            expect($link['label'] ?? null)->toBeString("Link [{$index}] must carry a string label in {$className}");
        }

        // 5. Verify json_encode does not return false or error and no Closure exists in the tree
        expect(json_encode($config))->not->toBeFalse();
        assertNoClosuresInTableConfig($config, $className);
    }
});