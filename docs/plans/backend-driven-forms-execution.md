# Form Synchronization — Plan B: Micro-Step Execution Guide for Agents

*Status: **active execution guide** — companion to `docs/plans/form-sync-plan-b-backend-driven.md`. Breaks the full backend-driven form system into atomic, independently verifiable micro-steps for autonomous agents.*

### Ordered Plan Files (`docs/plans/backend-driven-forms/`)

| # | Ordered File | Contents |
|---|---|---|
| **00** | [00-agent-protocol-and-rules.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/00-agent-protocol-and-rules.md) | Agent Operating Rules, Commands, Verification Protocol |
| **01** | [01-phase-0-backend-contract-tests.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/01-phase-0-backend-contract-tests.md) | Phase 0: Steps B0.1 – B0.4 (Pest Contract Tests) |
| **02** | [02-phase-1-engine-primitives.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/02-phase-1-engine-primitives.md) | Phase 1: Steps B1.1 – B1.5 (Types, OptionLoader, Groups, Audio, CKEditor) |
| **03** | [03-phase-2-hooks-and-page-shells.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/03-phase-2-hooks-and-page-shells.md) | Phase 2: Steps B2.1 – B2.4 (useCrudForm, useSettingsForm, Shells, Flags) |
| **04** | [04-phase-3-wave-1-crud-migration.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/04-phase-3-wave-1-crud-migration.md) | Phase 3: Steps B3.1 – B3.10 (11 CRUD Pages Migration) |
| **05** | [05-phase-4-wave-2-settings-migration.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/05-phase-4-wave-2-settings-migration.md) | Phase 4: Steps B4.1 – B4.7 (7 Settings Pages Migration) |
| **06** | [06-phase-5-wave-3-product-spike.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/06-phase-5-wave-3-product-spike.md) | Phase 5: Steps B5.1 – B5.2 (Product Form Spike & Decision) |
| **07** | [07-phase-6-cleanup-and-verification.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/07-phase-6-cleanup-and-verification.md) | Phase 6: Steps B6.1 – B6.2 (Dead Code Sweep & Verification Loop) |

---

## 1. Operating Rules for Executing Agents

For **every single step** in this guide, the agent MUST execute in the following strict cycle:

```text
[1. Read Spec] ─► [2. Implement Code] ─► [3. Run Test & Analysis] ─► [4. Format] ─► [5. Commit]
```

### Mandatory Rules:
1. **Atomic commits**: Commit ONLY the files belonging to the current step. Never combine multiple steps into one commit.
2. **Zero regressions**: At the end of every step, the repository must pass type checks (`npm run types`), linting (`npm run lint`), and relevant unit tests.
3. **No premature deletions**: Never delete legacy forms or hooks until the corresponding migrated page has passed its parity gate and feature flag validation.
4. **Backend is authority**: Field definitions, options, and validations originate in PHP. Never add hardcoded option choices or field definitions in React.
5. **Analyze before fixing**: When a test fails, carefully read the stack trace or output, determine the root cause, fix it, and re-run the test suite.

---

## Standard Commands Cheat Sheet

| Verification Task | Command |
|---|---|
| **TypeScript check** | `npm run types` |
| **ESLint check** | `npm run lint` |
| **Targeted Vitest** | `npm run test -- <relative-path-to-test>` |
| **Full Vitest suite** | `npm run test` |
| **Targeted Pest test** | `php artisan test --filter <TestClassName>` |
| **Full Pest test suite** | `php artisan test` |
| **Prettier formatting** | `npx prettier --write <touched-files>` |
| **Translation check** | `npm run translation:check` |

---

## Phase 0: Backend Readiness & Contract Verification (Pest)

Ensure all backend CRUD and Settings definitions serialize valid JSON and adhere to the contract before any UI work begins.

---

### Step B0.1: Crud Form Config Contract Test
- **Goal**: Verify that all autoloaded CRUD classes produce clean, serializable JSON without leaking closures.
- **Files**:
  - `[NEW]` `tests/Feature/CrudFormConfigContractTest.php`
- **Implementation**:
  1. Iterate over all registered Crud classes via `Hook::filter('sb-crud-resource', ...)` or by scanning `app/Crud/*Crud.php`.
  2. For each Crud, instantiate and call `getFormConfig()`.
  3. Assert response is an array containing keys: `form`, `labels`, `links`, `submitMethod`, `namespace`, `optionAttributes`.
  4. Assert `json_encode($config)` succeeds without error.
  5. Assert no `Closure` instance exists within the serialized data (especially inside `show` or `options`).
  6. Assert every field in `tabs.*.fields` contains `name` and a known `type`.
- **Test & Analyze**:
  - Run: `php artisan test --filter CrudFormConfigContractTest`
  - *Analysis*: If a closure is detected, identify which Crud or tab leaks it and fix the serialization in `CrudService::getFormConfig` or `CrudForm`.
- **Commit**:
  ```bash
  git add tests/Feature/CrudFormConfigContractTest.php
  git commit -m "test(crud): add pest contract test for CrudFormConfig serialization"
  ```
- **Exit Gate**: `php artisan test --filter CrudFormConfigContractTest` passes 100%.

---

### Step B0.2: Settings Form Config Contract Test
- **Goal**: Verify that all 11 Settings classes produce serializable form definitions with populated values.
- **Files**:
  - `[NEW]` `tests/Feature/SettingsFormConfigContractTest.php`
- **Implementation**:
  1. Scan `app/Settings/*Settings.php`.
  2. For each settings class (skipping non-autoloaded ones like `SuppliesDeliveriesSettings`), call `getForm()`.
  3. Assert keys present: `title`, `description`, `identifier`, `payload`, `options`, `form`.
  4. Assert `form['tabs']` contains valid field definitions.
  5. Assert `json_encode($form)` succeeds without error.
- **Test & Analyze**:
  - Run: `php artisan test --filter SettingsFormConfigContractTest`
  - *Analysis*: Check if any tab include throws due to uninitialized options or missing payload keys.
- **Commit**:
  ```bash
  git add tests/Feature/SettingsFormConfigContractTest.php
  git commit -m "test(settings): add pest contract test for SettingsPage form definitions"
  ```
- **Exit Gate**: `php artisan test --filter SettingsFormConfigContractTest` passes 100%.

---

### Step B0.3: `optionAttributes` Audit & Fix
- **Goal**: Verify `CrudService::$optionAttributes` across all CRUDs so option labels match actual database columns.
- **Files**:
  - `[MODIFY]` `app/Crud/*Crud.php` (only classes with mismatched attribute names, e.g. `PaymentTypeCrud.php`)
- **Implementation**:
  1. Inspect `optionAttributes` for each Crud (e.g. `PaymentType` uses `label`, not `name`).
  2. Align `protected $optionAttributes = ['label' => '...', 'value' => '...'];` with model attributes.
- **Test & Analyze**:
  - Run: `php artisan test --filter CrudFormConfigContractTest`
- **Commit**:
  ```bash
  git add app/Crud/
  git commit -m "fix(backend): align optionAttributes with actual model columns across Cruds"
  ```
- **Exit Gate**: Contract tests pass with zero attribute mismatches.

---

### Step B0.4: Error Bag Shape Contract Test
- **Goal**: Assert that validation errors on `POST /api/crud/{ns}` return 422 with dot-notated `{tabId}.{fieldName}` keys.
- **Files**:
  - `[NEW]` `tests/Feature/CrudValidationErrorsContractTest.php`
- **Implementation**:
  1. Create a Pest test acting as an authenticated admin.
  2. Send invalid POST payloads to representative Cruds: `sb.payments-types`, `sb.coupons`, `sb.taxes`.
  3. Assert status is `422`.
  4. Assert JSON response structure has `errors` keyed as expected by `SbForms::extractValidation`.
- **Test & Analyze**:
  - Run: `php artisan test --filter CrudValidationErrorsContractTest`
- **Commit**:
  ```bash
  git add tests/Feature/CrudValidationErrorsContractTest.php
  git commit -m "test(crud): verify 422 error bag keys follow tabId.fieldName convention"
  ```
- **Exit Gate**: 422 error contracts verified.

---

## Phase 1: Engine Core Primitives & Extended Field Types

Extend the existing `resources/js/components/forms/config-form/` components to handle all backend field types.

---

### Step B1.1: Complete Types Definition for Plan B
- **Goal**: Add missing types for group fields, page shells, and feature flags.
- **Files**:
  - `[MODIFY]` `resources/js/types/forms.ts`
- **Implementation**:
  1. Define `GroupFieldDef`: `{ fields: FormFieldDef[]; groups?: Array<Record<string, unknown>>; closable?: boolean; label?: string; }`.
  2. Define `CrudPageShellProps` and `SettingsPageShellProps`.
  3. Ensure `FormFieldType` includes all types from Plan B §4 table.
- **Test & Analyze**:
  - Run: `npm run types`
  - Run: `npm run lint`
- **Commit**:
  ```bash
  git add resources/js/types/forms.ts
  git commit -m "feat(forms): expand forms.ts types for group fields and page shells"
  ```
- **Exit Gate**: TypeScript compiles clean.

---

### Step B1.2: Option Loader Service & Refresh Watcher
- **Goal**: Implement dynamic option resolution and sibling watch reloading.
- **Files**:
  - `[NEW]` `resources/js/components/forms/config-form/option-loader.ts`
  - `[NEW]` `resources/js/components/forms/config-form/option-loader.test.ts`
- **Implementation**:
  1. Function `loadOptions(field, currentValues)`:
     - Returns `field.options` if statically provided.
     - If `field.refresh` is present, listens to `field.refresh.watch` value and calls `field.refresh.url`.
     - If `field.optionAttributes` is configured, calls `crudApi.list(namespace)`.
  2. Write unit tests covering static, refresh, and dynamic cases.
- **Test & Analyze**:
  - Run: `npm run test -- option-loader.test.ts`
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/components/forms/config-form/option-loader*
  git commit -m "feat(forms): add option-loader with dynamic fetch and refresh watcher support"
  ```
- **Exit Gate**: Unit tests pass with 100% coverage on loader scenarios.

---

### Step B1.3: AudioSelect & MultiKeySelector Field Types
- **Goal**: Wire `select-audio` and `inline-multiselect` in `field-renderer.tsx`.
- **Files**:
  - `[MODIFY]` `resources/js/components/forms/config-form/field-renderer.tsx`
  - `[NEW]` `resources/js/components/forms/config-form/field-renderer.test.tsx`
- **Implementation**:
  1. For `type === 'select-audio'`: render select dropdown alongside a play audio preview button using `new Audio(url).play()`.
  2. For `type === 'inline-multiselect'`: render `MultiKeySelector` returning array of strings.
  3. Write unit tests in `field-renderer.test.tsx` for both components.
- **Test & Analyze**:
  - Run: `npm run test -- field-renderer.test.tsx`
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/components/forms/config-form/field-renderer*
  git commit -m "feat(forms): add select-audio and inline-multiselect to field-renderer"
  ```
- **Exit Gate**: Both field types render, update values on change, and pass vitest.

---

### Step B1.4: GroupRenderer for Repeatable Field Rows
- **Goal**: Render repeatable sub-form rows (`type: 'group'`) with row overrides and add/remove capabilities.
- **Files**:
  - `[NEW]` `resources/js/components/forms/config-form/group-renderer.tsx`
  - `[NEW]` `resources/js/components/forms/config-form/group-renderer.test.tsx`
  - `[MODIFY]` `resources/js/components/forms/config-form/field-renderer.tsx`
- **Implementation**:
  1. `GroupRenderer` takes `{ field, value: Array<Record<string, unknown>>, onChange, errors }`.
  2. Renders rows with individual delete buttons if `closable !== false`.
  3. Provides "Add Row" button instantiating default field values from `field.fields`.
  4. Respects per-row field overrides (e.g. `disabled: true`).
  5. Integrates into `field-renderer.tsx` when `field.type === 'group'`.
- **Test & Analyze**:
  - Run: `npm run test -- group-renderer.test.tsx`
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/components/forms/config-form/group-renderer* resources/js/components/forms/config-form/field-renderer.tsx
  git commit -m "feat(forms): implement group-renderer for repeatable form rows"
  ```
- **Exit Gate**: Vitest tests pass for adding rows, removing rows, and rendering nested fields.

---

### Step B1.5: RichTextEditor (CKEditor) Component
- **Goal**: Provide HTML rich-text editing for `type === 'ckeditor'` without bundle bloat.
- **Files**:
  - `[NEW]` `resources/js/components/forms/config-form/rich-text-editor.tsx`
  - `[MODIFY]` `resources/js/components/forms/config-form/field-renderer.tsx`
- **Implementation**:
  1. Implement a clean rich text editor (or Textarea with formatting toolbar/preview) emitting HTML string.
  2. Wire into `field-renderer.tsx` under `type === 'ckeditor'`.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/components/forms/config-form/rich-text-editor.tsx resources/js/components/forms/config-form/field-renderer.tsx
  git commit -m "feat(forms): integrate rich-text-editor in field-renderer for ckeditor field type"
  ```
- **Exit Gate**: Category description fields render and update HTML clean.

---

## Phase 2: Engine Hooks & Page Shells

---

### Step B2.1: `useCrudForm` Hook
- **Goal**: Provide a single hook for CRUD create/edit forms managing data fetch, validation, submission, and error handling.
- **Files**:
  - `[NEW]` `resources/js/components/forms/config-form/use-crud-form.ts`
  - `[NEW]` `resources/js/components/forms/config-form/use-crud-form.test.ts`
- **Implementation**:
  1. Parameters: `{ namespace: string; id?: string | number; initialConfig?: CrudFormConfig; onSubmitted?: (res) => void }`.
  2. Fetches config on mount if not passed in props via `crudApi.formConfig(namespace, id)`.
  3. Hydrates initial form values using `initialValuesFromConfig`.
  4. On submit, validates using `validateConfigForm`; if clean, sends payload via `POST /api/crud/{ns}` or `PUT /api/crud/{ns}/{id}`.
  5. Maps 422 server responses into field errors.
  6. Follows `res.redirect` via `router.visit()` or calls `onSubmitted`.
- **Test & Analyze**:
  - Run: `npm run test -- use-crud-form.test.ts`
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/components/forms/config-form/use-crud-form*
  git commit -m "feat(forms): implement useCrudForm hook with fetch, submit, and error mapping"
  ```
- **Exit Gate**: Vitest tests pass for create, edit, client error, and 422 server error states.

---

### Step B2.2: `useSettingsForm` Hook
- **Goal**: Provide a single hook for Settings pages handling payload hydration, `null` delete semantics, and save operations.
- **Files**:
  - `[NEW]` `resources/js/components/forms/config-form/use-settings-form.ts`
  - `[NEW]` `resources/js/components/forms/config-form/use-settings-form.test.ts`
- **Implementation**:
  1. Parameters: `{ identifier: string; initialPayload?: Record<string, unknown>; initialOptions?: Record<string, unknown> }`.
  2. Saves payload to `POST /api/settings/{identifier}`.
  3. Ensures `null` values are sent explicitly to trigger option deletion on backend (`SettingsPage.php:155-162`).
  4. Triggers success toast notifications via `useToast`.
- **Test & Analyze**:
  - Run: `npm run test -- use-settings-form.test.ts`
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/components/forms/config-form/use-settings-form*
  git commit -m "feat(forms): implement useSettingsForm hook for settings pages"
  ```
- **Exit Gate**: Vitest tests pass for settings hydration, null-deletion, and save submission.

---

### Step B2.3: `CrudFormPage` Shell & Feature Flag Registry
- **Goal**: Create generic full-page CRUD container and feature flag mechanism.
- **Files**:
  - `[NEW]` `resources/js/components/forms/config-form/crud-form-page.tsx`
  - `[NEW]` `resources/js/lib/form-flags.ts`
- **Implementation**:
  1. `form-flags.ts`: Config map of feature flags for each module (e.g. `roles: true`, `units: false`), reading from `localStorage` or defaults.
  2. `CrudFormPage`: Page shell rendering header, breadcrumbs, back button, notices, and `ConfigForm`.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/components/forms/config-form/crud-form-page.tsx resources/js/lib/form-flags.ts
  git commit -m "feat(forms): add CrudFormPage shell and form migration feature flag utility"
  ```
- **Exit Gate**: Shell renders clean; compiles without type warnings.

---

### Step B2.4: `SettingsFormPage` Shell
- **Goal**: Create generic full-page Settings container.
- **Files**:
  - `[NEW]` `resources/js/components/forms/config-form/settings-form-page.tsx`
- **Implementation**:
  1. Renders settings tabs, description banners, save buttons, and footer.
  2. Connects to `useSettingsForm`.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/components/forms/config-form/settings-form-page.tsx
  git commit -m "feat(forms): add SettingsFormPage shell component"
  ```
- **Exit Gate**: SettingsFormPage compiles and tests clean.

---

## Phase 3: Wave 1 — CRUD Pages Migration (One Atomic Step Per Page)

For each page, apply the **Per-Page Parity Gate**:
1. Field census: all backend fields render.
2. Value round-trip: create -> list -> edit -> save works.
3. Server errors: 422 errors land inline.
4. Empty semantics preserved.
5. Verification loop green (`types`, `lint`).

---

### Step B3.1: Migrate Roles (`sb.roles`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/users/roles/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/users/roles/edit.tsx`
- **Implementation**:
  - Replace hand-written form markup with `CrudFormPage namespace="sb.roles"`.
  - Pass through Inertia props as initial data.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
  - Check in browser: navigate to `/dashboard/users/roles/create`, verify permissions matrix and fields render.
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/users/roles/
  git commit -m "feat(roles): migrate roles create and edit to CrudFormPage"
  ```

---

### Step B3.2: Migrate Payment Types (`sb.payments-types`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/orders/payments-types/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/orders/payments-types/edit.tsx`
- **Implementation**:
  - Replace with `CrudFormPage namespace="sb.payments-types"`.
  - Fixes the priority-label bug by construction.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/orders/payments-types/
  git commit -m "feat(payments): migrate payment types create and edit to CrudFormPage"
  ```

---

### Step B3.3: Migrate Units (`sb.units`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/units/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/units/edit.tsx`
- **Implementation**:
  - Replace with `CrudFormPage namespace="sb.units"`.
  - Gains inline `group_id` unit creation modal via `sbCrudForm`.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/units/
  git commit -m "feat(units): migrate units create and edit to CrudFormPage"
  ```

---

### Step B3.4: Migrate Taxes (`sb.taxes`) & Taxes Groups
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/taxes/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/taxes/edit.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/taxes/groups/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/taxes/groups/edit.tsx`
- **Implementation**:
  - Wire `CrudFormPage` with `sb.taxes` and `sb.taxes-groups`.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/taxes/
  git commit -m "feat(taxes): migrate taxes and tax groups to CrudFormPage"
  ```

---

### Step B3.5: Migrate Customers Groups
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/customers/groups/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/customers/groups/edit.tsx`
- **Implementation**:
  - Wire `CrudFormPage` with `CustomerGroupCrud` namespace.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/customers/groups/
  git commit -m "feat(customers): migrate customer groups to CrudFormPage"
  ```

---

### Step B3.6: Migrate Accounting Accounts (`sb.transactions-accounts`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/accounting/accounts/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/accounting/accounts/edit.tsx`
- **Implementation**:
  - Wire `CrudFormPage namespace="sb.transactions-accounts"`.
  - Verifies dynamic refresh config via option-loader on account type change.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/accounting/accounts/
  git commit -m "feat(accounting): migrate transaction accounts to CrudFormPage"
  ```

---

### Step B3.7: Migrate Accounting Transactions (`sb.transactions`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/accounting/transactions/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/accounting/transactions/edit.tsx`
- **Implementation**:
  - Wire `CrudFormPage namespace="sb.transactions"`.
  - Automatically brings in `group_id` and `scheduled_date` fields.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/accounting/transactions/
  git commit -m "feat(accounting): migrate transactions create and edit to CrudFormPage"
  ```

---

### Step B3.8: Migrate Coupons (`sb.coupons`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/customers/coupons/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/customers/coupons/edit.tsx`
  - `[MODIFY]` `resources/js/components/forms/config-form/registry.ts`
- **Implementation**:
  - Register code-generator button as a custom component.
  - Wire `CrudFormPage namespace="sb.coupons"`.
  - Gains `valid_until` / hours fields automatically.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/customers/coupons/ resources/js/components/forms/config-form/registry.ts
  git commit -m "feat(coupons): migrate coupons create and edit to CrudFormPage with code generator"
  ```

---

### Step B3.9: Migrate Rewards System (`sb.rewards-system`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/customers/rewards-system/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/customers/rewards-system/edit.tsx`
- **Implementation**:
  - Support root-level `rules` passthrough and register rules row editor in registry.
  - Wire `CrudFormPage`.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/customers/rewards-system/
  git commit -m "feat(rewards): migrate rewards system to CrudFormPage with rules editor"
  ```

---

### Step B3.10: Migrate Categories (`sb.products-categories`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/categories/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/categories/edit.tsx`
- **Implementation**:
  - Wire `CrudFormPage` with custom layout slot preserving 3-column layout.
  - Verifies rich-text description editor.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/categories/
  git commit -m "feat(categories): migrate categories create and edit to CrudFormPage"
  ```

---

## Phase 4: Wave 2 — Settings Pages Migration (One Atomic Step Per Page)

---

### Step B4.1: Migrate Accounting Settings (`AccountingSettings`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/accounting.tsx`
- **Implementation**:
  - Wire `SettingsFormPage identifier="accounting"`.
  - Automatically handles both `general` and `orders` tabs.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/accounting.tsx
  git commit -m "feat(settings): migrate accounting settings to SettingsFormPage"
  ```

---

### Step B4.2: Migrate Customers Settings (`CustomersSettings`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/customers.tsx`
- **Implementation**:
  - Wire `SettingsFormPage identifier="customers"`.
  - Automatically manages `sb_customers_default` with inline customer modal.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/customers.tsx
  git commit -m "feat(settings): migrate customers settings to SettingsFormPage"
  ```

---

### Step B4.3: Migrate Workers Settings (`WorkersSettings`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/workers.tsx`
- **Implementation**:
  - Wire `SettingsFormPage identifier="workers"`.
  - Respects disabled option from backend.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/workers.tsx
  git commit -m "feat(settings): migrate workers settings to SettingsFormPage"
  ```

---

### Step B4.4: Migrate Reports & Orders Settings (`ReportsSettings`, `OrdersSettings`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/reports.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/settings/orders.tsx`
- **Implementation**:
  - Wire `SettingsFormPage` for reports and orders settings.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/reports.tsx resources/js/pages/dashboard/settings/orders.tsx
  git commit -m "feat(settings): migrate reports and orders settings to SettingsFormPage"
  ```

---

### Step B4.5: Migrate Invoices & General Settings (`InvoicesSettings`, `GeneralSettings`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/invoices.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/settings/general.tsx`
- **Implementation**:
  - Wire `SettingsFormPage` across all 7 general tabs.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/invoices.tsx resources/js/pages/dashboard/settings/general.tsx
  git commit -m "feat(settings): migrate invoices and general settings to SettingsFormPage"
  ```

---

### Step B4.6: Migrate POS Settings (`POSSettings`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/pos.tsx`
- **Implementation**:
  - Wire `SettingsFormPage identifier="pos"`.
  - Drives all 6 POS tabs (shortcuts, audio, registers, barcode) via config.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/pos.tsx
  git commit -m "feat(settings): migrate pos settings to SettingsFormPage"
  ```

---

### Step B4.7: Reset Settings Decision & Parity Check (`ResetSettings`)
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/reset.tsx`
- **Implementation**:
  - Audit destructive confirmation modal UX.
  - Wire `SettingsFormPage` with custom confirmation action slot or retain guarded custom shell.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/reset.tsx
  git commit -m "feat(settings): complete reset settings migration and safety guard"
  ```

---

## Phase 5: Wave 3 — Product Form Spike & Decision (B3.a vs B3.b)

---

### Step B5.1: Product Form Spike & Variations Mapping Test
- **Files**:
  - `[NEW]` `tests/Feature/ProductCrudSpikeTest.php`
- **Implementation**:
  - Write test asserting `ProductCrud::getForm()` structure and variations assembly against `POST /api/products`.
  - Evaluate complexity of custom tab component (`sbProductGroup`) and selling-group rows.
- **Test & Analyze**:
  - Run: `php artisan test --filter ProductCrudSpikeTest`
- **Commit**:
  ```bash
  git add tests/Feature/ProductCrudSpikeTest.php
  git commit -m "chore(products): evaluate product form backend-driven migration spike"
  ```

---

### Step B5.2: Execute Product Decision
- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/products/`
- **Implementation**:
  - Either migrate to engine with `GroupRenderer` + `sbProductGroup` (B3.a) or document as sanctioned exception and purge dead props (B3.b).
- **Test & Analyze**:
  - Run: `npm run types && npm run lint && npm run test`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/products/
  git commit -m "feat(products): apply product form architecture decision"
  ```

---

## Phase 6: Deprecation, Cleanup & Verification Sweep

---

### Step B6.1: Retire Hand-Written Form JSX & Legacy Hooks
- **Files**:
  - `[DELETE]` Deprecated `use-*-form.ts` hooks and superseded hand-crafted form components.
- **Implementation**:
  - Remove obsolete code for fully migrated pages.
  - Verify zero lingering imports.
- **Test & Analyze**:
  - Run: `npm run types`
  - Run: `npm run lint`
- **Commit**:
  ```bash
  git add -u
  git commit -m "refactor(forms): remove superseded hand-written form JSX and legacy form hooks"
  ```

---

### Step B6.2: Full End-to-End Verification Sweep
- **Files**:
  - `[MODIFY]` `docs/agents/architecture.md`
  - `[MODIFY]` `docs/plans/form-sync-plan-b-backend-driven.md`
- **Implementation**:
  1. Run complete verification loop:
     - `npm run types`
     - `npm run lint`
     - `npm run test`
     - `php artisan test`
     - `npm run translation:check`
     - `npx prettier --write resources/`
  2. Update documentation marking Plan B complete and registering engine conventions.
- **Commit**:
  ```bash
  git add docs/
  git commit -m "docs(architecture): mark Plan B backend-driven form engine complete and update conventions"
  ```
- **Exit Gate**: All suites 100% green; repository completely clean.
