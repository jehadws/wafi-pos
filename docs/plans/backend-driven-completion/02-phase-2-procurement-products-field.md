# Backend-Driven Completion — Phase 2: `procurementProducts` Custom Field + Declarative Root Sections

*Directory: `docs/plans/backend-driven-completion/`*
*Sequence: Step 2 of 9 — frontend only; depends on Phase 1*

---

## Objective

1. Register a `procurementProducts` custom component in the config-form registry that reproduces the hand page's products tab + item modals **1:1** (same rows, same modals, same payload), driven by the Phase 1 `products` section.
2. Generalize the hardcoded root-`rules` special-case in `ConfigForm` into a declarative mechanism so `products` (and any future root section) renders without engine edits.

## Why this design

- The registry (`registry.ts`) already supports untyped `value/onChange` custom components; whole-tab custom components (`FormTabDef.component` → `sbProductGroup`) prove the pattern. But `products` is a **root-level section**, not a tab — and today the only root-level custom section is hardcoded: `config-form.tsx:326-343` looks up `values['rules']` and renders `getCustomComponent('rules')`; `buildCrudPayload` re-applies the same special-case (:70-83). Phase 1's `products` needs the same treatment; copying the special-case would be the second hardcode.
- The hand implementation is already well-factored: `procurement-products-tab.tsx` (search + rows), `procurement-item-modals.tsx` (options/unit/tax/convert modals), `use-procurement-form.ts` (row state, search, unit conversion, payload building via `buildProcurementPayload`). We reuse those files nearly verbatim behind one component boundary rather than rewriting them.

---

## Micro-Step P2.1 — Declarative root sections in `ConfigForm`

- **Files**: `[MODIFY]` `resources/js/components/forms/config-form/config-form.tsx`, `resources/js/types/forms.ts`
- **Implementation**:
  1. Codify the root-section recognition rule (aligned with `RewardSystemCrud`'s existing shape): a root key of `config.form` whose value is an object **with a `component` string** is a custom section. Extend `CrudFormDefinition` (`types/forms.ts:103-107`) docs/index-signature accordingly.
  2. `initialValuesFromConfig` (:89+): for every root custom-section key, `values[key] = config.form[key].value ?? []` (the backend seeds rows under `value` — same as `rules` today, `RewardSystemCrud:178-184`).
  3. `buildCrudPayload` (:48-86): replace the hardcoded `rules` block (:70-83) with a loop over all root custom-section keys: emit `payload[key] = values[key]`, applying the existing client-id cleanup **for any array-valued section** — strip keys matching `/^(_key|\$invalid|_clientId)$/` (`products` rows carry `_key`/`$invalid`; rules carry `_clientId`).
  4. Render block (:326-343): loop the same keys instead of the `rules` literal; each renders `getCustomComponent(config.form[key].component)` with `{field: {name: key, label, type: 'custom'}, value, onChange, error}`. Keep a **back-compat branch**: when the definition doesn't declare `component` but the key is `rules`, map to component name `'rules'` (RewardSystemCrud registers under `'rules'`).
  5. `validateConfigForm`/`parse-validation` untouched — custom sections validate inside their component (as `rules-editor-field` does).
- **Test & Analyze**:
  - `[NEW]` `custom-sections.test.tsx`: a config with root `{products: {component: 'x', value: [row]}}` seeds `values.products`, emits `payload.products` with `_key`/`$invalid` stripped, renders the registered component; the legacy `rules` config still works unchanged.
  - `npm run test` green.
- **Commit**: `refactor(forms): declarative root custom sections (generalize hardcoded rules case)`

## Micro-Step P2.2 — `procurementProducts` registry component

- **Files**: `[NEW]` `resources/js/components/forms/config-form/procurement-products-field.tsx` (self-registers via `registerCustomComponent('procurementProducts', …)`, imported for side effects from `config-form.tsx` alongside `./sb-crud-form`); `[MODIFY]` `resources/js/pages/dashboard/procurements/use-procurement-form.ts` (extract pure logic; the hook stays as a thin wrapper until Phase 3 deletes it)
- **Implementation** — port, do not rewrite:
  1. Props from the renderer: `{field, value, onChange, error, disabled}` where `field.props` carries `taxGroups` (Phase 1) and `value` is the rows array.
  2. Move into the component (or an extracted module) the row logic from `use-procurement-form.ts`: `makeRowKey`/`normalizeProductRow` (:9-16), `addProduct` dedupe (:80+, toast "This product is already added…"), `removeProduct`, `updateProduct`, `searchProduct` (POST `/api/procurements/products/search-product`), `getConvertUnits`, `activeModal` state (`ProcurementModalState`).
  3. JSX: reuse `ProcurementProductsTab` and `ProcurementItemModals` **as-is** by importing them (move them under `components/forms/config-form/` in the same commit — they are presentation-only and take everything via props). Client-side validation parity: `quantity`/`unit_id` required-ness is enforced server-side (Phase 1 validates rows via `ProcurementRequest`); the component keeps the `$invalid` visual marking by validating on every row edit; server 422s (`products.0.unit_id`) surface through the section banner (`errors[name]` prop).
  4. On any row mutation call `onChange(nextRows)`; strip nothing client-side — `_key`/`$invalid` are stripped in `buildCrudPayload` per P2.1.
  5. Empty-state, headers, currency formatting: unchanged (component reuse guarantees it).
- **Test & Analyze**:
  - `[NEW]` `procurement-products-field.test.tsx`: renders seeded rows; add-via-search dedupes (toast); remove works; unit/tax/convert modals open and write back through `onChange`; row edits mark `$invalid` for zero/negative quantity and missing unit; emitted values carry `_key`.
  - Parity checklist (manual): compare rendered tab against `dashboard/procurements/create` side-by-side before Phase 3 deletes it.
- **Commit**: `feat(forms): procurementProducts custom field (port products tab + item modals)`

---

## Risks / rollback

- The modals depend on `taxGroups` prop shape `{id, name, taxes?: {id, rate}[]}` — Phase 1 seeds exactly that; the test asserts it.
- If root-section auto-detection misfires on a Crud with an unrelated root key containing `component`, the back-compat `rules` branch keeps existing behavior; detection requires both a `component` string and a registration at render time (unregistered → `null` + dev warning, per `registry.ts`) — no crash path.
- Rollback: revert `config-form.tsx` (rules special-case restored); the custom field files are additive and unused without Phase 1's `products` section.

