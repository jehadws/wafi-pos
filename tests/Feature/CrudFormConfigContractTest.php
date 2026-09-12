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
    }
});
