# Backend-Driven Completion — Phase 5: Products Form Migration (spike-gated)

*Directory: `docs/plans/backend-driven-completion/`*
*Sequence: Step 5 of 9 — independent; **gate: spike report + user decision before implementation***

---

## Objective

Migrate the products create/edit forms (`products/create.tsx`, `edit.tsx` + `components/forms/product-form/*`: identification, images, groups (variations tree), taxes, units, expiry tabs + `selling-group-card.tsx`) onto the `crud/form` shell — **or record a renewed, evidence-based decision to keep them bespoke**. This un-sanctions the products bespoke exception either way: after this phase the exception is either gone or re-justified with numbers.

## Why spike-gated

- The bespoke form carries the multi-level variations tree (`{main, variations: [{tabs, selling_group, groups: {product_subitems}}]}`), dynamic unit conversions, and composite grouped subitems — the heaviest UI in the SPA. A blind migration risks regressing product creation, which feeds the POS/cart/stock chain (stock invariant, ground rule 5).
- `ProductCrud::getForm` (`ProductCrud.php:166+`) already has a real spike (covered by `tests/Feature/ProductCrudSpikeTest.php`) with authored tabs (identification fields, variations.* validation strings) — so the backend side is started, not blank.

## Micro-Step P5.1 — Spike (read-only + one throwaway branch)

- **Files**: no production changes; report appended to this file
- **Implementation**:
  1. Map every bespoke tab → target carrier:
     | Bespoke | Target |
     |---|---|
     | identification fields (name, category, barcode, sku, type, status, description…) | plain `getForm` fields (mostly authored already in the spike) |
     | images tab (`media`) | `FormInput::media` field(s) |
     | taxes tab | fields + possibly `group` rows |
     | units tab (unit conversions) | `group` field type (repeatable rows, `GroupFieldDef`) or custom field |
     | groups tab (variations tree + selling group cards) | custom field component (registry) — port `groups-tab.tsx` + `selling-group-card.tsx` behind it |
     | expiry tab | fields |
  2. Payload audit: the bespoke pages post to **dedicated** `/api/products` (`submitUrl` prop, `ProductsController.php:393`) consumed by `ProductService`. Decide the write path:
     - **Option A (recommended if ProductService must stay the only writer): honor `config.submitUrl`/`submitMethod`** — engine change in `use-crud-form.ts:151` + `sb-crud-form.tsx:125`: use `config.submitUrl` when present (fall back to namespace endpoints). `getFormConfig` already computes it from `getLinks()['post'/'put']` (`CrudService.php:1490-1495`); add `'post' => sb()->url('/api/products')`, `'put' => sb()->url('/api/products/{id}')` to `ProductCrud::getLinks()`. Error mapping: dedicated 422s already return Laravel dot keys (`variations.*.units…`) — verify they align with ConfigForm's dot-key errors; add a mapping shim in the engine change if keys differ (e.g. `*` → indexes).
     - **Option B**: same `disablePost/disablePut` + `beforePost/beforePut → ProductService` delegation as Phase 1 — keeps everything on the crud API but forces the nested-reshape helper for a much larger payload (variations), and ProductService::create may not be idempotent-safe when called from a generic endpoint.
  3. Size the work honestly; write the spike report with a recommendation and **stop for user approval**.
- **Commit**: `docs: products form migration spike report`

## Micro-Step P5.2 — Engine: honor `submitUrl` (only if Option A chosen)

- **Files**: `[MODIFY]` `resources/js/components/forms/config-form/use-crud-form.ts`, `sb-crud-form.tsx`, `resources/js/api/crud.ts`
- **Implementation**:
  1. `useCrudForm.submit`: if `config.submitUrl` is set, `post/put` there (method from `config.submitMethod`, default post/put by id); else the namespace endpoints (unchanged for all existing resources).
  2. `sb-crud-form.tsx` modal submit: same honor-rule.
  3. `crudApi.create/update` gain optional `urlOverride` params, or add `crudApi.postUrl/putUrl` helpers — keep `crud.ts`'s doc contract accurate.
  4. Unit tests: with `submitUrl` set → request goes to it; without → namespace path (regression guard for the 11 migrated resources).
- **Commit**: `feat(forms): honor config submitUrl/submitMethod in crud form shell`

## Micro-Step P5.3 — Author `ProductCrud::getForm` + custom fields, migrate, delete

- **Files**: `[MODIFY]` `app/Crud/ProductCrud.php`; `[NEW]` registry components under `resources/js/components/forms/config-form/` (e.g. `product-variations-field.tsx`); `[MODIFY]` `app/Http/Controllers/Dashboard/ProductsController.php`; `[DELETE]` `resources/js/pages/dashboard/products/create.tsx`, `edit.tsx`, `resources/js/components/forms/product-form/*`
- **Implementation**: per the approved spike — tabs → fields; groups tab → `productVariations` registry component (port `groups-tab.tsx`/`selling-group-card.tsx` behind the `CustomFieldComponentProps` boundary); controller sweep to `ProductCrud::form()`/`form($product)`; delete hand files; parity checklist as in Phase 3.
- **Test & Analyze**: contract test (unique names across ProductCrud tabs — the spike's `variations.*` validation strings must be checked against `extractValidation` semantics); a write-path feature test against the chosen endpoint; full frontend gates.
- **Commit**: `feat(products): backend-driven product form (variations via custom field)`

---

## Risks / rollback

- Largest phase in the suite; ship behind the spike gate and land P5.3 as several commits (per tab) so rollback is granular.
- If the spike concludes "keep bespoke", Phase 9 records the renewed decision with the spike's numbers — the exception stops being folklore.

---

## P5.1 Spike Report (appended) — verdict: **migrate, via Option B** — ⛔ gated on user approval

*Read-only sweep on `feat/backend-driven-tables` (`e42bc8e`). No production code touched. Evidence verified live: `php artisan test --filter=ProductCrudSpikeTest` green (1 passed, 19 assertions). This report supersedes the "keep bespoke" conclusion comment inside `ProductCrudSpikeTest` — that verdict predates the two mechanisms that dissolve its blockers: declarative root custom sections (Phase 2) and the service-delegation write pattern (Phase 1).*

### 1. What the bespoke surface is today

- Pages: `pages/dashboard/products/create.tsx` / `edit.tsx` → `product-form-fields.tsx` (100 L) + `use-product-form.ts` (275 L).
- Tabs (`components/forms/product-form/`): identification-tab (175 L), selling-group-card (181 L), groups-tab (150 L), units-tab (114 L), types (114 L), images-tab (135 L), taxes-tab (60 L), expiry-tab (48 L) — **≈ 1.3k bespoke lines** with the pages.
- Write path: Inertia `form.post('/api/products')` / `form.put('/api/products/{id}')` (`use-product-form.ts:260-270`) → `ProductsController::saveProduct` / `updateProduct` → `ProductService::create/update`. Payload: `{name, variations: [{identification, groups, units, expiracy, taxes, images, $primary}]}` (`buildTransform`, `use-product-form.ts:120-163`).
- Scope truth: the SPA edits **one `$primary` variation only** — `product_type` is hardcoded `'product'` (`ProductsController.php:65`); the multi-variation tree is not editable here (variable-product variations are managed through the separate `createSingleVariation`/`editSingleVariation` endpoints, `routes/api/products.php:39,42`). The migration surface is therefore smaller than feared: no variable-product tree UI.
- The pages already receive `src` / `submitUrl` / `submitMethod` / `returnUrl` props from the controller (`ProductsController.php:354-388`) — leftovers of the earlier backend-driven attempt that the bespoke pages ignore.

### 2. Tab → carrier map (evidence)

| Bespoke tab | Backend spike def (`ProductCrud::getForm`) | Carrier | Gap |
|---|---|---|---|
| main `name` | authored: label/validation/description (`ProductCrud.php:266-272`) | ConfigForm main field | none |
| identification (category `sbCrudForm` w/ modal-create, sku, barcode, barcode_type, type, status, stock_management, description) | fully authored 1:1 incl. options + `sbCrudForm` props (`282-396`) | ConfigForm tab fields (FieldRenderer) | none — the bespoke tab already renders category through the registered `sbCrudForm` component (`identification-tab.tsx:43`) |
| taxes (tax_group_id, tax_type) | authored 1:1 with `TaxGroup` options (`506-527`) | ConfigForm tab fields | none — bespoke pulls tax groups from a page prop (`taxes-tab.tsx:12`); the def carries the options |
| expiry (expires, on_expiration) | authored 1:1 (`479-504`) | ConfigForm tab fields | none |
| images (multi-file instant upload via `mediasApi`, preview grid w/ delete, first-URL input) | `media` + `featured` fields per row, pre-filled `groups` from `galleries` (`529-560+`) | repeatable `group` rows — `GroupRenderer` exists (`group-renderer.tsx`) | partial — the instant-upload + preview-grid behavior ports inside the section component (the engine `media`/file-picker semantics differ); no engine change |
| units (unit_group `sbCrudForm` locked once rows exist, accurate_tracking, auto_cogs + repeatable selling-group cards) | plain fields authored + `type: 'group'` `selling_group` whose `fields` are fully authored (unit_id w/ `sbCrudForm`, convert_unit_id w/ `different:variations.*.units.selling_group.*.unit_id` rule `:198`, prices, cogs, stock_alert, low_quantity, visible, preview_url, hidden id/quantity) + per-row `disabled` for assigned units (`428-476`) | ConfigForm `GroupRenderer` (repeatable add/remove rows already supported) | partial — unit options are refiltered client-side per selected unit_group today (`units-tab.tsx:119`) while the authored def ships the first group's units (`177-179`); the refilter moves into the section component; the convert-unit "clear" button is cosmetic parity |
| groups (grouped-product subitems; shown only when `type === 'grouped'`) | marker: `tabs.groups.component = 'sbProductGroup'` (asserted by the spike test) | registry custom component — port `groups-tab.tsx` 1:1 behind `CustomFieldComponentProps` (product search via `productsApi`, per-row unit-quantity fetch) | **engine gap** — `TabFields` renders only `tab.fields` and ignores a tab-level `component` (`config-form.tsx:244-278`); under the section approach (§3) this is moot: the whole tree is one section |

### 3. Payload audit (the deciding evidence)

- ConfigForm's contract (`buildCrudPayload`, `config-form.tsx:95-133`): `{[main]: v, [tabId]: {…}, [sectionKey]: rows}`; it renders `config.form.tabs` only.
- ProductCrud's authored form is `{main, variations: [{tabs: …}]}` — **no root `tabs`**, so the generic shell would render just the name field. `variations` is an array, so `isRootCustomSection` (`config-form.tsx:62-64`) doesn't match it either.
- **The fix is the Phase-2 mechanism, not a new engine concept**: reshape the def to a declarative root custom section — `variations: {component: 'productVariations', value: […primary variation values…], tabs: {…authored defs…}}`. Then `initialValuesFromConfig` seeds it (`config-form.tsx:153-159`), `buildCrudPayload` emits `payload.variations` verbatim minus client bookkeeping (`:117-124`), and `ConfigForm` renders it through the registry after the main field (`:400-419`) — exactly `procurementProducts`' lifecycle. The authored per-tab field defs ride `props.tabs` and render through `FieldRenderer`, so the fields stay backend-driven; only the tree/row logic is bespoke code.
- 422 error keys: `ProductRequest::rules()` = `Arr::dot(extractProductValidaton())` → keys like `variations.0.units.selling_group.0.unit_id`. These belong to the tree, not to `{tabId}.{field}` — whichever write path is chosen, they surface through the section component, which today receives only `error: string` (`registry.ts:30`). → **one small engine addition**: pass the raw `errors` map to root custom sections alongside `error` (backwards compatible; existing sections ignore it).
- Coupling to adapt: `SbForms::extractProductValidaton` (`SbForms.php:21-56`) iterates `$form['variations']` as an array of `{tabs}` — after the reshape it must read the section's `tabs` key. Its only caller is `ProductRequest::rules()` (verified).

### 4. Write path — Option A vs Option B

**Option B (recommended): generic crud endpoints + `disablePost/disablePut` + `beforePost/beforePut → ProductService`** (the Phase-1 ProcurementCrud pattern, `ProcurementCrud.php:84-86, 303-350`). For products it lines up unusually well:

1. `BaseCrudRequest::getPlainData` delegates to **the resource's own** `getFlatForm` (`BaseCrudRequest.php:10-16`) — for products that is the override (`ProductCrud.php:915-951`) which already converts `{name, variations}` into the exact `ProductService` payload (it mirrors `ProductsController::saveProduct:46-88`, incl. `product_type` and the `sb-update-products-inputs` hook). Procurements needed a hand-written `toServicePayload`; products' equivalent already exists and is live on `updateProduct` today.
2. `beforePost($unfiltredInputs, null, $inputs)` receives both the raw `{name, variations}` and the flattened service payload (`CrudService.php:292-298`) → `ProductService::create($inputs)` / `update($entry, $inputs)`.
3. `disablePost/disablePut` prevents the generic fill/save block from assigning the `variations` array onto the model; `skippable` belt-and-braces like ProcurementCrud.
4. Response contract already JSON: `submitRequest` returns `{status, message, redirect, entry}` for expectsJson (`CrudService.php:431-444`); add `public $to_route = 'sb.dashboard.products'` (ProcurementCrud.php:44 precedent) and `useCrudForm` navigates via `res.redirect` — same UX as today's `to_route` redirect.
5. Permissions preserved: `$permissions['create'/'update']` exist on ProductCrud; `beforePost/beforePut` run `allowedTo(...)` first (ProcurementCrud:336 pattern).
6. Validation: `CrudPostRequest` extracts only `name` (root-tabs shape, `SbForms::extractValidation:61-82`); nested rules are enforced in `beforePost` by re-running `ProductRequest::rules()` via `Validator::make` (double-validation pattern, `ProcurementCrud.php:341-347`) — the `variations.*.…` keys match the raw payload.

**Option A (honor `config.submitUrl` → dedicated `/api/products`)** works but costs strictly more:

- P5.2 engine change (`use-crud-form.ts:151`, `sb-crud-form.tsx:125`, `crudApi` url-override) + regression tests for the 11 migrated resources;
- `ProductCrud::getLinks()` lacks post/put links today (`ProductCrud.php:835-842` — only list/create/edit);
- the dedicated endpoints return `to_route()` **redirects** (`ProductsController.php:90,135`) — axios follows the 302 into the dashboard HTML and the engine's JSON contract breaks, so the endpoints must be converted to the JSON `{status, message, redirect}` shape (safe — the bespoke form is their only consumer, `productsApi` has no create/update);
- it still needs the same section-level error handling (§3), so the extra work buys no parity benefit.

**Verdict: Option B.** P5.2 becomes unnecessary (recorded as not-needed); `ProductService` stays the single transactional writer; reuses tested backend code.

### 5. Revised P5.3 shape (supersedes the micro-step sketch above)

1. **Backend** — reshape `ProductCrud::getForm` to `{main: name, variations: {component: 'productVariations', value: […], tabs: {…}}}`; add `disablePost/disablePut/skippable/$to_route` + `beforePost/beforePut → ProductService`; adapt `extractProductValidaton`; delete consumer-less `getExtractedProductForm` (`ProductCrud.php:873-909`, zero callers verified).
2. **Engine (tiny)** — root custom sections receive the raw `errors` map in addition to `error`.
3. **Frontend** — `[NEW] product-variations-field.tsx` registry component: port the six bespoke tabs (mostly verbatim JSX); identification/expiry/taxes render their authored defs via `FieldRenderer`; rows (selling_group / images / groups) keep bespoke row logic + `sbCrudForm` modal-create.
4. **Controller sweep** — `createProduct`/`editProduct` → `ProductCrud::form()` / `form($product)`; the `categories`/`unitGroups`/`taxes`/`src`/`submitUrl` props die (options now live in `getForm`; `usePage` props in the tabs go away).
5. **Delete** — `pages/dashboard/products/create|edit.tsx`, `product-form-fields.tsx`, `use-product-form.ts`, `components/forms/product-form/*` (≈ 1.3k lines). The dedicated `saveProduct`/`updateProduct` handlers become consumer-less — recorded as Phase 9 delete candidates (the single-variation endpoints `createSingleVariation`/`editSingleVariation` are separate consumers and stay).

### 6. Sizing (honest)

| Chunk | Estimate |
|---|---|
| Backend def reshape + write delegation + `extractProductValidaton` adaptation + feature tests (write path on `/api/crud/sb.products` for create & edit, unique field names across section tabs, 422 error keys, `ProductService` still sole writer) | ~1 day |
| `product-variations-field.tsx` port (6 tabs) + errors-map engine tweak + component tests | 1–1.5 days |
| Controller sweep + deletes + full gates (`php artisan test`, `npm run types/lint/test`) + manual smoke (create simple / grouped product w/ sub-items, barcode scan focus, multi-image upload, selling-group conversion) | 0.5–1 day |
| **Total** | **≈ 3–3.5 days**, landable as 4–5 commits (backend def → field component → engine errors tweak → controller sweep + deletes). Per-tab landing is not natural — the tabs live inside one section — so rollback granularity is per commit, as Phase 4's was |

### 7. Decision requested

⛔ **Stopping here per the phase gate.** Approve **Option B** → proceed to P5.3 as revised (P5.2 skipped as not-needed). Or reject → Phase 9 records this report as the renewed, evidence-based bespoke exception. The numbers no longer support "keep bespoke": the heaviest-UI objection reduces to one already-mechanized pattern (root custom section) plus one small engine addition.
