# Backend-Driven Completion — Phase 1: Procurement Form Definition + Write Delegation (backend)

*Directory: `docs/plans/backend-driven-completion/`*
*Sequence: Step 1 of 9 — backend only; no page migrations yet*

---

## Objective

Replace the auto-dumped `ProcurementCrud::getForm` (`ProcurementCrud.php:142+`) with an authored form definition that reproduces the hand create/edit page exactly, and make the **generic crud write path** delegate procurement writes to `ProcurementService` (single transactional writer — products + stock sync).

## Why this design

- The dedicated endpoints (`POST /api/procurements`, `PUT /api/procurements/{id}` — `routes/api/procurements.php`) expect a **nested** payload `{ name, general: {…7 whitelisted fields…}, products: [...] }` and `ProcurementService::create/edit` (`ProcurementService.php:107`, `:192`) consume exactly that shape. `ConfigForm`'s payload contract (`{ main, tabId: {…} }`) already matches it — so the authored form's main field is `name` and the tab identifier must be `general`.
- We keep the write flowing through `ProcurementService` by using the sanctioned `disablePost`/`disablePut` mechanism (`CrudService.php:304-307`): the generic `POST/PUT /api/crud/sb.procurements` endpoints perform **zero** direct model writes; `beforePost/beforePut` reshape the flat inputs back to the nested shape and delegate. The SPA now talks to one endpoint family (the crud API), the backend keeps one writer.
- Field names come from the legacy authored blueprint `app/Forms/procurement/general.php` (invoice_reference, delivery_time, invoice_date, automatic_approval, delivery_status, payment_status, provider_id) — that file is the field spec; copy it into `getForm`, don't reinvent labels/descriptions.

---

## Micro-Step P1.1 — Author `ProcurementCrud::getForm`

- **Files**: `[MODIFY]` `app/Crud/ProcurementCrud.php`
- **Implementation**:
  1. **main** — keep `name` (`FormInput::text`, `validation: 'nullable|string|max:255'` per `ProcurementRequest.php:29`; description "Provide a name that will help to identify the procurement." — the hand page's copy, not the dump's).
  2. **`general` tab** — fields copied from `app/Forms/procurement/general.php` with `value: $entry->… ??` defaults preserved:
     - `invoice_reference` (text, nullable), `delivery_time` (date, default `sb()->date->now()->format('Y-m-d')`), `invoice_date` (date, same default), `automatic_approval` (switch, No/Yes, default 1),
     - `delivery_status` (select, required, options pending/delivered/draft — mirror `ProcurementRequest.php:31` `in:delivered,pending,draft`; the legacy blueprint omits `draft`, the request is authoritative),
     - `payment_status` (select, required, unpaid/paid per `ProcurementRequest.php:32`),
     - `provider_id` (`FormInput::searchSelect`, `component: 'sbCrudForm'`, `props: ProviderCrud::getFormConfig()`, `options: Helper::toJsOptions(Provider::get(), ['id','first_name'])`, `validation: 'required'` — `exists:subul_providers,id` is enforced server-side by the request/service).
  3. **Root-level `products` section** (the `rules` precedent, `RewardSystemCrud:85,178-184`):
     - `'products' => ['component' => 'procurementProducts', 'taxGroups' => TaxGroup::with('taxes:id,tax_group_id,rate')->get()->toArray()]`
     - On edit (`$entry instanceof Procurement`): seed rows from the same source the hand edit page used — copy the mapping in `ProcurementController::updateProcurement` (:305-330) verbatim (rows carry `product_id, name, unit_id, unit_quantities, unit_group, purchase_price, quantity, tax_group_id, tax_value, total_purchase_price, …` — whatever `ProcurementProductItem` in `resources/js/services/procurement.ts` requires; the component consumes the same shape).
     - Client keys `_key`/`$invalid` are generated client-side and stripped server-side when delegating (P1.3).
  4. Every field name must be **unique across main + general** (contract test). `products` lives outside tabs so it cannot collide.
- **Test & Analyze**:
  - `php artisan test --filter=CrudFormConfigContractTest` — `ProcurementCrud` must pass **without** the allowlist (see P1.4).
  - `[NEW]` `tests/Feature/ProcurementCrudFormConfigTest.php` — assert: main `name`; `general` tab identifier normalized; the 7 fields with types/options; unique names; `products` section with `taxGroups`; on an existing procurement the rows are seeded.
- **Commit**: `feat(crud): author ProcurementCrud::getForm (real fields, unique names, products section)`

## Micro-Step P1.2 — Permissions & flags

- **Files**: `[MODIFY]` `app/Crud/ProcurementCrud.php`
- **Implementation**:
  1. `$permissions['update'] => 'subul.update.procurements'` (was `false` at :76 — `allowedTo(false)` throws, which currently blocks `getFormConfig(entry)`, `CrudService.php:1508-1515`). The dedicated PUT route middleware already requires the same permission, so no privilege change.
  2. `public $disablePost = true; public $disablePut = true;` — the generic fill/save block (`CrudService.php:304-372`) is skipped; nothing but `ProcurementService` writes procurements.
  3. `$skippable = ['products']` (matches `RewardSystemCrud:85`; belt-and-braces since the save block is disabled).
  4. Keep `$fillable = []`, `$to_route = 'sb.dashboard.procurement-list'` (success redirect target, `CrudService.php:435`).
  5. **Delete untouched** — the table's DELETE action already posts to `/api/crud/sb.procurements/{id}` and works today.
- **Commit**: same commit as P1.1 (one logical change).

## Micro-Step P1.3 — `beforePost`/`beforePut` delegation to ProcurementService

- **Files**: `[MODIFY]` `app/Crud/ProcurementCrud.php`
- **Implementation**:
  1. Private helper `toServicePayload(array $inputs): array` — reshape the **flat** `getPlainData` output (`SbForms.php:120-172`) into the nested shape:
     - `$payload['name'] = $inputs['name']`
     - `$payload['general'] = collect($inputs)->only(['provider_id','delivery_status','payment_status','invoice_reference','delivery_time','invoice_date','automatic_approval'])->all()` (the exact whitelist `ProcurementService` accepts, `ProcurementService.php:146-147`)
     - `$payload['products'] = collect($inputs['products'] ?? [])->map(fn ($row) => collect($row)->except(['_key','$invalid'])->all())->values()->all()`.
  2. `beforePost($inputs): void` — `$this->allowedTo('create')`; build nested payload; **row validation**: `Validator::make($payload, app(ProcurementRequest::class)->rules())->validate()` (covers `products.*.product_id|unit_id|quantity|purchase_price|tax_type`, `ProcurementRequest.php:37-43` — the form definition cannot express row rules). `validate()` raises `ValidationException` with dot keys (`general.provider_id`, `products.0.unit_id`) that map onto `ConfigForm` errors / the section banner. Then `app(ProcurementService::class)->create($payload)`.
  3. `beforePut($inputs, $entry): void` — same but `allowedTo('update')` + `ProcurementService::edit($entry->id, $payload)`. The service throws on `delivery_status === 'stocked'` (`ProcurementService.php:224-226`) — catch and surface as a validation error on `general.delivery_status` (422, not 500), matching `ProcurementController::edit:84`'s guard.
  4. Double validation is intentional: `CrudPostRequest` already validated the `general.*` rules extracted from the form definition; the `beforePost` Validator re-checks them plus row rules — identical rules, and it keeps `ProcurementRequest` the single source of truth.
  5. No `afterPost/afterPut` — the service did everything inside `beforePost/beforePut`.
- **Test & Analyze** (`[NEW]` `tests/Feature/ProcurementCrudWriteTest.php`, `Gate::before(fn () => true)`):
  - `POST /api/crud/sb.procurements` with `{name, general: {...}, products: [...]}` → 200 `{status: success, redirect: …/dashboard/procurements}`; procurement + procurement_products rows created; **stock untouched**; provider enforced.
  - Invalid row (missing `unit_id`) → 422 with `products.0.unit_id`.
  - `PUT /api/crud/sb.procurements/{id}` updates header + replaces products; a stocked procurement → 422 on `general.delivery_status`.
  - `products` omitted → still succeeds (nullable per `ProcurementRequest.php:37`) — parity with the dedicated endpoint.
- **Commit**: `feat(crud): delegate sb.procurements writes to ProcurementService (disablePost/disablePut)`

## Micro-Step P1.4 — Contract-test allowlist removal

- **Files**: `[MODIFY]` `tests/Feature/CrudFormConfigContractTest.php`
- **Implementation**: remove `'ProcurementCrud'` from `$knownDuplicates` (:77); update the comment to point at `docs/plans/backend-driven-completion/01` (customers/users follow in Phases 6–7).
- **Test & Analyze**: `php artisan test --filter=CrudFormConfigContractTest` green; the other two names still allowlisted.
- **Commit**: folded into P1.1's commit.

---

## Risks / rollback

- The `general` tab payload key must equal the service's expected `general` section — covered by the write test (P1.3).
- If `extractValidation` does NOT prefix tab rules with `general.` (verify first with a failing probe test — evidence says it does: `CrudPostRequest.php:56-61`), the P1.3 helper's full `ProcurementRequest` Validator still enforces everything server-side; in that case reduce the per-field `validation` strings to client-side hints only and note it.
- Rollback = revert the ProcurementCrud commit; the dedicated endpoints and hand pages are untouched until Phase 3.

