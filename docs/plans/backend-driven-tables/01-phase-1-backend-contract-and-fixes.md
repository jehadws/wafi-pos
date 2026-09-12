# Backend-Driven Tables — 01: Phase 1 Backend Contract & Fixes

*Directory: `docs/plans/backend-driven-tables/`*
*Sequence: Step 1 of 7*

---

## Objective

Lock the backend table contract with Pest tests, deduplicate the table-config assembly, fix the known backend bugs (#5, #6), and normalize the action definitions (types, labels, confirm texts) so the frontend engine can render whatever arrives without special cases.

---

## Micro-Step T1.1: Table Config Contract Test

- **Goal**: Assert `GET /api/crud/{ns}/config` shape across all 35 registered CRUD resources.
- **Target File**: `[NEW]` `tests/Feature/CrudTableConfigContractTest.php`
- **Implementation Instructions**:
  1. Iterate all registered CRUD namespaces (same discovery approach as `CrudFormConfigContractTest` over `app/Crud/*Crud.php`).
  2. For each resource, build the config via `CrudService::getTableConfig()` (added in T1.3):
     - Assert keys: `columns`, `queryFilters`, `labels`, `links`, `bulkActions`, `prependOptions`, `showOptions`, `showCheckboxes`, `headerButtons`, `namespace`.
     - Assert every column entry has a string `label` and boolean-coercible `$sort` / `$direction`.
     - Assert every `bulkActions` entry has `label` + `identifier` (`url` optional — the executor composes it from the namespace).
     - Assert `links` entries serialize to `{type: 'link', href, label}` (`CrudLink`).
     - Assert `json_encode($config)` succeeds and no `Closure` appears anywhere in the tree.
  3. `Gate::before(fn () => true)` as in `CrudFormConfigContractTest`.
- **Test & Analyze**: `php artisan test --filter CrudTableConfigContractTest`
- **Commit**: `test(crud): add pest contract test for crud table config serialization`
- **Exit Criteria**: 100% pass; every failing CRUD fixed in its PHP class, never skipped.

---

## Micro-Step T1.2: Entry/Action Contract Test

- **Goal**: Assert `CrudService::getEntries()` returns a paginator whose rows carry well-formed `$actions`.
- **Target File**: `[NEW]` `tests/Feature/CrudEntryActionsContractTest.php`
- **Implementation Instructions**:
  1. For each registered CRUD with a settable model, seed or use existing rows and call `getEntries()` (or hit `GET /api/crud/{ns}`).
  2. Assert paginator shape: `current_page`, `data`, `total`, `per_page`, `last_page`.
  3. For every row:
     - `$actions` is an array (may be empty); each action has `label`, `identifier`, `url`, `confirm`, `type`, `permissions`.
     - `type` ∈ `GOTO | DELETE | GET | POPUP`.
     - `GOTO`/`GET`/`DELETE` actions carry a non-empty `url`; `confirm` (when set) is `{message: string, title?: string}`.
     - `label` contains no raw HTML (`strip_tags($label) === $label`).
     - `$cssClass`, when present, is a string.
  4. Acting as a user lacking a permission, assert the action carrying that `permissions` requirement is absent (pins the server-side guarantee behind bug #8).
- **Test & Analyze**: `php artisan test --filter CrudEntryActionsContractTest`
- **Commit**: `test(crud): add pest contract test for entry actions shape and permission filtering`
- **Exit Criteria**: 100% pass.

---

## Micro-Step T1.3: Extract `CrudService::getTableConfig()`

- **Goal**: Single source for the array currently inlined in `CrudController::getConfig:265-279`, so Inertia list controllers can pass `initialConfig` (mirrors `getFormConfig` for forms).
- **Files**:
  - `[MODIFY]` `app/Services/CrudService.php` — add `public function getTableConfig(string $namespace): array` containing the Hook-filtered assembly (`columns`, `queryFilters`, `labels`, `links` via `getFilteredLinks`, `bulkActions`, `prependOptions`, `showOptions`, `showCheckboxes`, `headerButtons`).
  - `[MODIFY]` `app/Http/Controllers/Dashboard/CrudController.php` — `getConfig()` delegates to it.
- **Test & Analyze**: `php artisan test --filter CrudTableConfigContractTest` (must stay green).
- **Commit**: `refactor(crud): extract getTableConfig for reuse by inertia list controllers`

---

## Micro-Step T1.4: Fix `GlobalProductHistoryCrud` Delete Type (bug #5)

- **File**: `[MODIFY]` `app/Crud/GlobalProductHistoryCrud.php` (~line 390).
- **Implementation**: change the delete action `type` from `GOTO` to `DELETE`; keep/normalize the `confirm` payload.
- **Test & Analyze**: `php artisan test --filter CrudEntryActionsContractTest`
- **Commit**: `fix(crud): use DELETE type for global product history delete action`

---

## Micro-Step T1.5: Fix `CouponOrderHistoryCrud` URL Typo (bug #6)

- **File**: `[MODIFY]` `app/Crud/CouponOrderHistoryCrud.php`.
- **Implementation**: correct the misspelled URL/route fragment ("hitory" → "history") and verify the referenced route exists in `routes/web/customers.php`; fix both sides if the typo is in the route registration too.
- **Test & Analyze**: `php artisan route:list` spot check + `php artisan test`.
- **Commit**: `fix(crud): correct 'hitory' typo in coupon order history URLs`

---

## Micro-Step T1.6: Action Normalization Sweep

- **Goal**: Make every action definition render-safe and behavior-correct.
- **Files**: `[MODIFY]` `app/Crud/*Crud.php` (sweep), notably `TransactionsHistoryCrud.php`, `HoldOrderCrud.php`, `OrderCrud.php`, `ProductCrud.php`, `ProductHistoryCrud.php`, `RegisterHistoryCrud.php`, `CouponCrud.php`.
- **Implementation Instructions**:
  1. **Reclassify GOTO-on-API-URL**: any `GOTO` whose `url` starts with `sb()->url('api/…')` becomes `GET` + confirm (first: "Create Reflection", `TransactionsHistoryCrud:356-360`; review `HoldOrderCrud` `sb.open` "Continue").
  2. **Strip HTML from labels**: replace `'<i class="mr-2 las la-…"></i> ' . __('X')` with plain `__('X')` everywhere (icons may later be re-introduced as an optional `icon` key — not now).
  3. **Standardize delete confirms**: every delete action gets `confirm: ['title' => __('Confirm Your Action'), 'message' => __('Would you like to delete this ?')]` unless the resource needs a custom message (then the title stays constant).
  4. **Verify the POPUP set**: enumerate all `POPUP` actions (`OrderCrud` `sb.order-options` / `sb.order-refunds`; `ProductCrud` preview / quantities; `RegisterHistoryCrud` details; `ProductHistoryCrud` description) and record them in the audit doc — this becomes the popup-registry mapping in T2.6.
  5. **Audit GET actions**: confirm each GET endpoint (roles clone, procurements set-as-paid / refresh, transactions trigger, create-reflection) exists as an API route with its permission middleware.
- **Test & Analyze**: `php artisan test --filter CrudEntryActionsContractTest` + full `php artisan test` for regressions.
- **Commit**: `fix(crud): normalize entry actions - plain labels, delete confirms, GOTO reclassification`

---

## Micro-Step T1.7: Action-Target Inventory

- **Goal**: Every action exposed by the backend must have an existing SPA target (route/page) before a page renders it.
- **Implementation Instructions**:
  1. For each GOTO action across CRUDs, resolve its URL against the SPA route map (`routes/web/*.php` → Inertia pages). Record: exists / missing.
  2. Special attention: Coupons History (`/dashboard/customers/coupons/history/{id}` — no route found at planning time), users → customer sub-lists (Orders/Rewards/Coupons/Wallet History), providers See-Procurements/Products, cash-registers History, orders Invoice/Receipt (print pages — verify whether they are Inertia pages or direct HTML responses; direct HTML should open in a new tab, not `router.visit`).
  3. Write the result table into `docs/backend-driven-tables-audit.md` ("Action-target inventory"). Missing targets are scheduled into Phase 5 before their host page migrates (rule 6 in `00`).
- **Test & Analyze**: none (documentation).
- **Commit**: `docs(tables): add action-target inventory to tables audit`
- **Exit Criteria**: no GOTO/POPUP action on a migrated page points at a missing target.

