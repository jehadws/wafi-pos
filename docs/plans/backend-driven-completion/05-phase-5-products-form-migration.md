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
