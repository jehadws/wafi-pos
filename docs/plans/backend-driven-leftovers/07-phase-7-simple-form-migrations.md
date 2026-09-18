# Leftover Work — Phase 7: Simple Form Migrations

*Directory: `docs/plans/backend-driven-leftovers/`*
*Sequence: Step 7 of 8*

---

## Objective

Migrate the last 3 **simple** hand-written CRUD form resources to the backend-driven engine — now a controller one-liner + file deletion thanks to Phase 2/3: **cash registers** (`RegisterCrud`), **providers** (`ProviderCrud`), **unit groups** (`UnitGroupCrud`).

All three backends already satisfy the contract (`CrudFormConfigContractTest` covers every `app/Crud/*` class and is green), and the tab-`identifier` normalization (`CrudService.php:1347-1354`) covers their raw-array tabs.

## Prerequisites

- Phases 2 and 3 landed (`XCrud::form()` renders `crud/form` with embedded `initialConfig`).
- `php artisan test` baseline respected (see Phase 6).

## Per-resource parity gate (identical to Phase 3)

- [ ] No client-side config fetch on create/edit (network tab).
- [ ] Field census: every backend field renders, incl. selects with backend options.
- [ ] Create flow, edit flow (stored values populate), 422 inline errors.
- [ ] `npm run types && npm run lint && npm run test`; `php artisan test` no new failures.

---

## Micro-Step L7.1: Cash Registers (`sb.registers`)

- **Files**:
  - `[MODIFY]` `app/Http/Controllers/Dashboard/CashRegistersController.php` — create (:51) / edit (:62) → `RegisterCrud::form();` / `RegisterCrud::form($register);`
  - `[DELETE]` `resources/js/pages/dashboard/cash-registers/create.tsx`
  - `[DELETE]` `resources/js/pages/dashboard/cash-registers/edit.tsx`
- **Implementation notes**:
  - Parity check vs the hand page (`create.tsx:43-49`): the hand page posts `{ name, general: { status, description } }`; `buildCrudPayload` produces the same nested shape from the backend config — verify `RegisterCrud::afterPost()/afterPut()` accept it.
  - RegisterCrud.php:192 shows `'value' => \->status ?? ''` -- no default is seeded in the field def; the status select has `Register::STATUS_CLOSED` and `::STATUS_DISABLED` as options but no pre-selected default in the form config. Confirm after switching that the create form either seeds a sensible default via `\['fields']` override or accepts blank (which maps to empty string on submit).
- **Commit**:
  ```bash
  git add app/Http/Controllers/Dashboard/CashRegistersController.php resources/js/pages/dashboard/cash-registers/
  git commit -m "feat(forms): migrate cash registers create/edit to CrudFormPage"
  ```

---

## Micro-Step L7.2: Providers (`sb.providers`)

- **Files**:
  - `[MODIFY]` `app/Http/Controllers/Dashboard/ProvidersController.php` — create (:58) / edit (:67) → `ProviderCrud::form();` / `ProviderCrud::form($provider);`
  - `[DELETE]` `resources/js/pages/dashboard/providers/create.tsx`
  - `[DELETE]` `resources/js/pages/dashboard/providers/edit.tsx`
- **Implementation notes**:
  - The hand page wraps the payload in `{ general: { … } }` across 7 fields (`first_name`, `last_name`, `email`, `phone`, 2× address, `description`) — the backend config is the source of truth now; verify the address fields render as grouped/tab fields and edit-mode hydration fills them.
  - `ProviderCrud` is on the raw-array-tabs list — its identifiers come from the Phase-2-era normalization; smoke-test both tabs render on load (no blank tab).
- **Commit**:
  ```bash
  git add app/Http/Controllers/Dashboard/ProvidersController.php resources/js/pages/dashboard/providers/
  git commit -m "feat(forms): migrate providers create/edit to CrudFormPage"
  ```

---

## Micro-Step L7.3: Unit Groups (`sb.units-groups`)

- **Files**:
  - `[MODIFY]` `app/Http/Controllers/Dashboard/UnitsController.php` — create (:156) / edit (:170) → `UnitGroupCrud::form();` / `UnitGroupCrud::form($group);`
  - `[DELETE]` `resources/js/pages/dashboard/units/groups/create.tsx`
  - `[DELETE]` `resources/js/pages/dashboard/units/groups/edit.tsx`
  - `[DELETE]` `resources/js/pages/dashboard/units/groups/use-unit-group-form.ts`
  - `[DELETE]` `resources/js/pages/dashboard/units/groups/unit-group-form-fields.tsx`
- **Implementation notes**:
  - `UnitGroupCrud` is **also** embedded as the `sbCrudForm` inline-create modal on the units pages (`sb-crud-form.tsx` path) — after this migration, smoke-test that inline modal too (open Units → "+" on the group select → create a group → it appears selected).
  - The old hook (`use-unit-group-form.ts`) posts to `unitsApi`-style endpoints — verify the crud submit path (`links.post/put` from the config) targets the same URLs the units table expects.
- **Commit**:
  ```bash
  git add app/Http/Controllers/Dashboard/UnitsController.php resources/js/pages/dashboard/units/groups/
  git commit -m "feat(forms): migrate unit groups create/edit to CrudFormPage"
  ```

## Phase gate

- `resources/js/pages/dashboard/{cash-registers,providers,units/groups}` contain no form pages.
- Full verification loop: `npm run types && npm run lint && npm run test && php artisan test && npm run test:e2e` (checkout-critical flows unaffected, but run them once before the branch merges).
- Update the `architecture.md` coverage sentence (Phase 1's L1.2) — the three resources move from "hand-written" to "covered".
