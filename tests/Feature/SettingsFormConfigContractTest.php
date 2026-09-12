<?php

use App\Models\User;
use App\Services\SettingsPage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;

function assertNoClosuresInSettings(mixed $data, string $path = ''): void
{
    if ($data instanceof \Closure) {
        test()->fail("Found Closure at path: {$path}");
    }
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            assertNoClosuresInSettings($value, $path === '' ? (string) $key : "{$path}.{$key}");
        }
    }
}

it('serializes valid form definitions with populated values for all settings pages', function () {
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $this->actingAs($user);

    $settingsFiles = File::files(app_path('Settings'));

    $testedCount = 0;

    foreach ($settingsFiles as $file) {
        $className = 'App\\Settings\\' . $file->getFilenameWithoutExtension();
        if (! class_exists($className) || ! is_subclass_of($className, SettingsPage::class)) {
            continue;
        }

        // Skip non-autoloaded settings (e.g. SuppliesDeliveriesSettings)
        if (defined("{$className}::AUTOLOAD") && ! $className::AUTOLOAD) {
            continue;
        }

        // Skip informational view-only pages without form/payload
        if (! method_exists($className, 'getPayload')) {
            continue;
        }

        /** @var SettingsPage $settings */
        $settings = new $className;
        $form = $settings->getForm();
        $identifier = $settings->getIdentifier();
        $payload = $settings->getPayload();
        $options = $settings->getOptions();

        $contract = [
            'title' => $form['title'] ?? null,
            'description' => $form['description'] ?? null,
            'identifier' => $identifier,
            'payload' => $payload,
            'options' => $options,
            'form' => $form,
        ];

        // 1. Assert presence of required top-level contract keys
        $requiredKeys = ['title', 'description', 'identifier', 'payload', 'options', 'form'];
        foreach ($requiredKeys as $key) {
            expect(array_key_exists($key, $contract))->toBeTrue("Missing key [{$key}] in {$className}");
        }

        expect($contract['title'])->toBeString("Title must be string in {$className}");
        expect($contract['identifier'])->toBeString("Identifier must be string in {$className}");
        expect($contract['payload'])->toBeArray("Payload must be array in {$className}");
        expect($contract['options'])->toBeArray("Options must be array in {$className}");
        expect($contract['form'])->toBeArray("Form must be array in {$className}");

        // 2. Assert form['tabs'] contains valid field definitions with unique field names existing in payload
        expect($form)->toHaveKey('tabs');
        expect($form['tabs'])->toBeArray("Tabs must be array in {$className}");

        $allFieldNames = [];

        foreach ($form['tabs'] as $tabKey => $tab) {
            if (isset($tab['fields']) && is_array($tab['fields'])) {
                foreach ($tab['fields'] as $field) {
                    if (is_array($field) && ! empty($field['name'])) {
                        $fieldName = $field['name'];
                        expect(isset($field['name']))->toBeTrue("Field missing name in {$className} tab {$tabKey}");
                        expect($field['name'])->toBeString("Field name must be string in {$className} tab {$tabKey}");
                        expect(isset($field['type']))->toBeTrue("Field missing type in {$className} tab {$tabKey}");
                        expect($field['type'])->toBeString("Field type must be string in {$className} tab {$tabKey}");

                        // Assert field names are unique across tabs
                        expect(in_array($fieldName, $allFieldNames))->toBeFalse("Duplicate field name [{$fieldName}] across tabs in {$className}");
                        $allFieldNames[] = $fieldName;

                        // Assert every tab field exists in payload (flat, nested by tab, or dot-key)
                        $existsInPayload = array_key_exists($fieldName, $payload)
                            || (isset($payload[$tabKey]) && is_array($payload[$tabKey]) && array_key_exists($fieldName, $payload[$tabKey]))
                            || (isset($tab['identifier']) && isset($payload[$tab['identifier']]) && is_array($payload[$tab['identifier']]) && array_key_exists($fieldName, $payload[$tab['identifier']]))
                            || array_key_exists("{$tabKey}.{$fieldName}", $payload);

                        expect($existsInPayload)->toBeTrue("Field [{$fieldName}] in tab [{$tabKey}] must exist in payload for {$className}");
                    }
                }
            }
        }

        // 3. Assert json_encode does not return false or throw
        $json = json_encode($contract);
        expect($json)->not->toBeFalse("json_encode failed for {$className}: " . json_last_error_msg());

        // 4. Assert no Closure instances in array tree
        assertNoClosuresInSettings($contract, $className);

        $testedCount++;
    }

    expect($testedCount)->toBeGreaterThanOrEqual(9, 'Expected at least 9 form-based settings classes tested');
});
