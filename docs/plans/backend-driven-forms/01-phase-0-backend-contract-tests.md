# Plan B — 01: Phase 0 Backend Contract Tests

*Directory: `docs/plans/backend-driven-forms/`*  
*Sequence: Step 1 of 7*

---

## Objective
Establish automated Pest contract tests verifying that all backend CRUD and Settings definitions serialize cleanly into valid JSON without leaking closures or failing on options.

---

## Micro-Step B0.1: Crud Form Config Contract Test

- **Goal**: Assert that `CrudService::getFormConfig()` serializes to clean JSON across all 37 CRUD resources.
- **Prerequisites**: Working Laravel environment with Pest.
- **Target File**:
  - `[NEW]` `tests/Feature/CrudFormConfigContractTest.php`
- **Implementation Instructions**:
  1. Create a Pest test that queries all registered CRUD resources.
  2. For each CRUD:
     - Instantiate the resource.
     - Call `getFormConfig()`.
     - Verify response contains: `['form', 'labels', 'links', 'submitMethod', 'namespace', 'optionAttributes']`.
     - Verify `json_encode($config)` does not return false or throw.
     - Verify no `Closure` instances are present anywhere in the array tree.
     - Verify every field in `tabs.*.fields` has a string `name` and recognized `type`.
- **Test & Analysis Instructions**:
  - Run: `php artisan test --filter CrudFormConfigContractTest`
  - *Analysis*: If any CRUD fails with a closure serialization error, inspect the specific Crud class's `getForm()` method to see if a `show` callback or closure was uncalled. Fix in the PHP Crud class.
- **Commit Specification**:
  ```bash
  git add tests/Feature/CrudFormConfigContractTest.php
  git commit -m "test(crud): add pest contract test for CrudFormConfig serialization"
  ```
- **Exit Criteria**: Test passes 100% with all CRUD resources passing assertions.

---

## Micro-Step B0.2: Settings Form Config Contract Test

- **Goal**: Assert that `SettingsController::getForm()` serializes valid form definitions with populated values for all settings pages.
- **Target File**:
  - `[NEW]` `tests/Feature/SettingsFormConfigContractTest.php`
- **Implementation Instructions**:
  1. Create a test iterating over all `app/Settings/*Settings.php` (skipping non-autoloaded like `SuppliesDeliveriesSettings`).
  2. For each settings class:
     - Call `getForm()`.
     - Assert presence of `title`, `description`, `identifier`, `payload`, `options`, `form`.
     - Assert `form['tabs']` contains valid field definitions.
     - Assert `json_encode($form)` is valid.
- **Test & Analysis Instructions**:
  - Run: `php artisan test --filter SettingsFormConfigContractTest`
  - *Analysis*: If an exception occurs due to database settings missing, ensure the test seeds or uses defaults gracefully.
- **Commit Specification**:
  ```bash
  git add tests/Feature/SettingsFormConfigContractTest.php
  git commit -m "test(settings): add pest contract test for SettingsPage form definitions"
  ```
- **Exit Criteria**: Test passes 100%.

---

## Micro-Step B0.3: `optionAttributes` Audit & Fix

- **Goal**: Align `protected $optionAttributes` on Crud classes with the actual database columns of the model.
- **Target Files**:
  - `[MODIFY]` `app/Crud/*Crud.php` (e.g. `PaymentTypeCrud.php`)
- **Implementation Instructions**:
  1. Review models where the display column is `label` rather than `name`.
  2. Ensure `optionAttributes` matches `['label' => '...', 'value' => 'id']`.
- **Test & Analysis Instructions**:
  - Run: `php artisan test --filter CrudFormConfigContractTest`
- **Commit Specification**:
  ```bash
  git add app/Crud/
  git commit -m "fix(backend): align optionAttributes with actual model columns across Cruds"
  ```
- **Exit Criteria**: No column mismatches remain.

---

## Micro-Step B0.4: Error Bag Shape Contract Test

- **Goal**: Verify that validation errors on `POST /api/crud/{ns}` return status 422 with `{tabId}.{fieldName}` keys.
- **Target File**:
  - `[NEW]` `tests/Feature/CrudValidationErrorsContractTest.php`
- **Implementation Instructions**:
  1. Create authenticated test sending empty/invalid payloads to `POST /api/crud/sb.payments-types` and `POST /api/crud/sb.coupons`.
  2. Assert response status is `422`.
  3. Assert error response body contains `errors` map with dot-keys corresponding to tab-scoped fields.
- **Test & Analysis Instructions**:
  - Run: `php artisan test --filter CrudValidationErrorsContractTest`
- **Commit Specification**:
  ```bash
  git add tests/Feature/CrudValidationErrorsContractTest.php
  git commit -m "test(crud): verify 422 error bag keys follow tabId.fieldName convention"
  ```
- **Exit Criteria**: 422 contract is verified against live API routes.
