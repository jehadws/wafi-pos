# Leftover Work — 00: Overview & Verification Results

*Directory: `docs/plans/backend-driven-leftovers/`*
*Sequence: Step 0 of 8 — read me first*

> Branch: `feat/backend-driven-tables`.
> This plan suite supersedes the informal "Leftover Work Plan: Backend-Driven Tables & Forms" summary. Several of that plan's items were **already fixed on the branch** — the verification table below is the corrected baseline. Do not re-implement items marked ✅ FIXED.

---

## Objective

Close out the backend-driven forms/tables initiative:

1. Refresh stale docs and delete dead form files (Phase 1).
2. Give CRUD forms the same "single generic shell + `initialConfig`" architecture the tables already have (Phases 2–3).
3. Fix the two remaining engine findings (Phase 4 strip-tags allowlist, Phase 5 registry re-key).
4. Make the full Pest suite green (Phase 6).
5. Migrate the last 3 simple CRUD form resources (Phase 7).
6. Record what is blocked/deferred and why (Phase 8).

Every phase is atomic: implement → verify (per-phase gate) → commit.

---

## Verification results (audited on this branch, per file:line)

### Forms audit items (`docs/backend-driven-forms-audit.md`)

| # | Finding | Status | Evidence |
|---|---|---|---|
| Addendum | Tab `identifier` missing → blank tabs | ✅ FIXED | `CrudService.php:1347-1354` normalizes `$tab['identifier'] ?? (string) $tabKey`; `CrudFormConfigContractTest.php:50-68` asserts it |
| 1 | Reward rule `id` → 500 on edit | ✅ FIXED | `rules-editor-field.tsx:23` uses `_clientId`, no `id` |
| 2 | `option-loader.ts` dead-wired | ✅ FIXED | imported by `field-renderer.tsx:16` |
| 3 | Empty-value filter tautology (`SbForms`) | ✅ FIXED | `app/Traits/SbForms.php:152` = `$value !== null && $value !== ''`; Pest test `CrudValidationErrorsContractTest.php:41`; contract comments accurate (`types/forms.ts:9-12`, `api/crud.ts:45-47`, `sb-crud-form.tsx:22-23`) |
| 4 | `datetime` fields blank on edit | ✅ FIXED | `field-renderer.tsx:24` `formatDatetimeLocal` + vitest `config-form.test.tsx:206` |
| 5 | Settings null-delete unguarded | ✅ FIXED | `SettingsFormConfigContractTest.php:74-104` (unique names across tabs + every field exists in payload) |
| 6 | `initialConfig` prop is dead | 🔴 OPEN | No controller passes a **form** config (only `CrudService::table()` does, line 1232) → **Phases 2–3** |
| 7 | Settings 422 never inline | ✅ FIXED | `use-settings-form.ts:204-208` maps per-field; `settings-form-page.tsx:202` renders |
| 8 | `lib/form-flags.ts` dead code | ✅ FIXED | `resources/js/lib/` holds only `settings.ts`, `utils.ts` |
| 9 | Orphans missed by cleanup | 🟡 PARTIAL | Old orphans deleted; **7 new orphans found** (taxes, tax-groups, categories, coupons) → **Phase 1** |
| 10 | `architecture.md` overstates coverage | 🔴 OPEN | Line ~117 still claims ConfigForm "covers all other CRUD and settings resources" → **Phase 1** |
| 11 | Blanket `strip_tags()` vs RichTextEditor | 🔴 OPEN | Actual sites: `CrudService.php:337` (crud saves), `Options.php:158` + `UserOptions.php:30` (settings saves) — **not** in `SbForms`. `CrudController.php:372` is Excel export, benign → **Phase 4** |
| 12 | FilePicker clears value on failure | ✅ FIXED | `config-form/file-picker.tsx:37-39` (no `onChange(null)`), `:18-20` (preview resync) |
| 13 | Registry name-hijack (`'code'` key) | 🔴 OPEN | `code-generator-field.tsx:36` registers under generic field name `code` → **Phase 5** |
| 14 | 13 pre-existing Pest failures | 🔴 OPEN | `php artisan test` → 13 failed / 34 passed. Root-cause evidence in **Phase 6** |

### Tables

- List pages: 27 migrated via the generic `crud/list` shell; exceptions per `architecture.md` known-debt #7/#8. **Track D of the old plan needs no action** — the bespoke `page.tsx` files (`medias`, `accounting/rules`, `stock-adjustment`, `print-labels`, `orders/receipt`, `orders/invoice`) are documented or non-CRUD by design. *(Update: the 7th file, `products`, has since migrated to `ProductCrud::table()` — Phase 4 of `docs/plans/backend-driven-completion/`; known-debt #8 records the resolution.)*

### Corrected form-page census (replaces the old plan's "~14/21 migrated")

- **Migrated (11 resources, 22 page files)**: categories, taxes, taxes/groups, units, coupons, customer groups, rewards system, roles, accounting transactions, accounting accounts, payment types.
- **Hand-written, simple (3 resources — Phase 7)**: cash registers, providers, unit groups.
- **Hand-written, blocked (3 resources — Phase 8)**: customers, users, procurements — duplicate field names across tabs collide in `SbForms::getFlatForm` (later-tab-wins flattening; `ProcurementCrud` has main-name/tab-name duplication).
- **Stray hand-written file**: `procurements/products/edit.tsx` (dedicated endpoint, not the generic crud API).
- **Sanctioned bespoke**: products (`create.tsx`/`edit.tsx` + `components/forms/product-form/*`) — documented exception.

### Dead-code corrections (replaces the old Track C)

- `productsApi.getAll()` — **KEEP**: live caller at `components/forms/product-form/groups-tab.tsx:39`.
- `customers.ts` dead methods (`getCustomerCoupons`, `getCustomerRewards`, `getAccountHistory`) — **already deleted**. Backend routes (`routes/api/customers.php:17-19`) still exist → decision recorded in Phase 8.
- Orphans deletable **now**: 7 files (Phase 1). Deletable **after Phase 7**: unit-group hook + fields. Deletable **after unblocking customers/users/procurements**: their hooks + fields (Phase 8).

---

## Phase index & execution order

| Phase | Title | Depends on |
|---|---|---|
| 1 | Docs & orphan cleanup | — |
| 2 | Generic CRUD form shell (`pages/crud/form.tsx` + `CrudService::form()` → Inertia) | — |
| 3 | Controller sweep to `XCrud::form()` + delete 22 per-resource page shells (fixes audit #6) | 2 |
| 4 | `strip_tags` per-field allowlist (fixes audit #11) | — (design decision first) |
| 5 | Registry re-key — drop the generic `'code'` registration (fixes audit #13) | — |
| 6 | Pest suite green — null-safe user language (fixes audit #14) | — |
| 7 | Simple form migrations: cash registers, providers, unit groups | 2, 3 |
| 8 | Blocked & deferred record (customers / users / procurements + decisions) | documentation only |

Phases 1, 4, 5, 6 are independent of 2/3/7 and can run in parallel. Phase 6 must be green before the branch merges (the verification loop gates on `php artisan test`).

---

## Ground rules (every phase)

1. Frontend gate: `npm run types && npm run lint && npm run test` — zero errors, zero warnings.
2. Backend gate: `php artisan test` — must not introduce failures beyond the 13 known ones until Phase 6 lands; must be fully green after Phase 6.
3. UI strings go through `useTranslation`; new strings require `npm run translation:check`.
4. Commits follow the existing convention (`feat(forms): …`, `fix(backend): …`, `docs: …`, `chore(cleanup): …`).
5. Never re-do an item marked ✅ FIXED in the table above.

