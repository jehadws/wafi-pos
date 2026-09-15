<?php

use App\Models\User;
use App\Services\CrudService;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;

function assertNoClosuresInArray(mixed $data, string $path = ''): void
{
    if ($data instanceof \Closure) {
        test()->fail("Found Closure at path: {$path}");
    }
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            assertNoClosuresInArray($value, $path === '' ? (string) $key : "{$path}.{$key}");
        }
    }
}

it('serializes getFormConfig to clean JSON across all registered CRUD resources', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $crudFiles = File::files(app_path('Crud'));
    expect($crudFiles)->toHaveCount(37);

    foreach ($crudFiles as $file) {
        $className = 'App\\Crud\\' . $file->getFilenameWithoutExtension();
        expect(class_exists($className))->toBeTrue();
        expect(is_subclass_of($className, CrudService::class))->toBeTrue();

        /** @var CrudService $className */
        $config = $className::getFormConfig();

        // 1. Verify required keys
        $requiredKeys = ['form', 'labels', 'links', 'submitMethod', 'namespace', 'optionAttributes'];
        foreach ($requiredKeys as $key) {
            expect(array_key_exists($key, $config))->toBeTrue("Missing key [{$key}] in {$className}");
        }

        // 2. Verify json_encode does not return false or error
        $json = json_encode($config);
        expect($json)->not->toBeFalse();

        // 3. Verify no Closure instances are present in array tree
        assertNoClosuresInArray($config, $className);

        // 4. Verify tabs have valid string identifier and fields have string name and type
        if (isset($config['form']['tabs']) && is_array($config['form']['tabs'])) {
            foreach ($config['form']['tabs'] as $tabKey => $tab) {
                expect(isset($tab['identifier']))->toBeTrue("Tab missing identifier in {$className} tab {$tabKey}");
                expect($tab['identifier'])->toBeString("Tab identifier must be string in {$className} tab {$tabKey}");
                expect($tab['identifier'])->not->toBeEmpty("Tab identifier must not be empty in {$className} tab {$tabKey}");

                if (isset($tab['fields']) && is_array($tab['fields'])) {
                    foreach ($tab['fields'] as $field) {
                        if (is_array($field)) {
                            expect(isset($field['name']))->toBeTrue("Field missing name in {$className} tab {$tabKey}");
                            expect($field['name'])->toBeString("Field name must be string in {$className} tab {$tabKey}");
                            expect(isset($field['type']))->toBeTrue("Field missing type in {$className} tab {$tabKey}");
                            expect($field['type'])->toBeString("Field type must be string in {$className} tab {$tabKey}");
                        }
                    }
                }
            }
        }

        // 5. Field names must be unique across main + every tab — `SbForms::getFlatForm`
        //    flattens the submit body per field name (later tab wins), so a duplicate
        //    silently overwrites the earlier value on POST/PUT.
        //
        // Blocked migrations (docs/plans/backend-driven-leftovers/08): these Cruds
        // still carry duplicate field names across tabs. Remove from this list when
        // their forms are redesigned (L8.2) and migrated. ProcurementCrud left the
        // list in docs/plans/backend-driven-completion/01 (customers/users follow
        // in Phases 6–7).
        $knownDuplicates = ['CustomerCrud', 'UserCrud'];
        $shortName = $file->getFilenameWithoutExtension();

        if (! in_array($shortName, $knownDuplicates, true)) {
            $allFieldNames = [];
            $fieldGroups = [];

            if (isset($config['form']['main']) && is_array($config['form']['main']) && ! empty($config['form']['main']['name'])) {
                $fieldGroups['main'] = [$config['form']['main']];
            }

            foreach ($config['form']['tabs'] ?? [] as $tabKey => $tab) {
                if (is_array($tab) && isset($tab['fields']) && is_array($tab['fields'])) {
                    $fieldGroups[$tabKey] = $tab['fields'];
                }
            }

            foreach ($fieldGroups as $groupKey => $fields) {
                foreach ($fields as $field) {
                    if (is_array($field) && ! empty($field['name']) && is_string($field['name'])) {
                        expect(in_array($field['name'], $allFieldNames, true))->toBeFalse(
                            "Duplicate field name [{$field['name']}] in {$className} (main/tabs group [{$groupKey}]) — SbForms flattening would overwrite it"
                        );
                        $allFieldNames[] = $field['name'];
                    }
                }
            }
        }
    }
});
