# Plan B "backend-driven forms" audit

> Branch `feat/backend-driven-forms` — commits `446b9ae..0b6cd9e` (40 commits).
> Scope: the form engine (`resources/js/components/forms/config-form/*`), hooks/shells, all 14 migrated CRUD pages, 8 settings pages, and the backend contract (`app/Traits/SbForms.php`, `app/Services/CrudService.php`, `app/Services/SettingsPage.php`, `app/Settings/*`, `app/Crud/*`).
> Method: static review + two throwaway PHP audit scripts run against a booted app (removed afterwards) + the full verification loop.

**Verification loop result at audit time:**

| Check | Result |
|---|---|
| `npm run types` | ✅ clean |
| `npm run lint` | ✅ clean (zero warnings) |
| `npm run test` (Vitest) | ✅ 328 tests / 42 files pass |
| New Pest contract tests | ✅ `CrudFormConfigContractTest`, `CrudValidationErrorsContractTest`, `SettingsFormConfigContractTest`, `ProductCrudSpikeTest` all pass |
| `php artisan test` (full) | ❌ 13 failures — all pre-existing, see item 14 |


## Status (updated by `docs/plans/backend-driven-leftovers/`)

| # | Finding | Status | Evidence / owner |
|---|---|---|---|
| Addendum | Tab `identifier` missing → blank tabs | ✅ FIXED | `CrudService.php:1347-1354` normalizes `$tab['identifier'] ?? (string) $tabKey`; asserted by `CrudFormConfigContractTest.php:50-68` |
| 1 | Reward rule `id` → 500 on edit | ✅ FIXED | `rules-editor-field.tsx:23` uses `_clientId`, no `id` |
| 2 | `option-loader.ts` dead-wired | ✅ FIXED | imported by `field-renderer.tsx:16` |
| 3 | Empty-value filter tautology (`SbForms`) | ✅ FIXED | `app/Traits/SbForms.php:152` = `$value !== null && $value !== ''`; pinned by `CrudValidationErrorsContractTest.php:41` |
| 4 | `datetime` fields blank on edit | ✅ FIXED | `field-renderer.tsx:24` `formatDatetimeLocal` + vitest `config-form.test.tsx:206` |
| 5 | Settings null-delete unguarded | ✅ FIXED | `SettingsFormConfigContractTest.php:74-104` (unique names across tabs + every field exists in payload) |
| 6 | `initialConfig` prop is dead | ✅ FIXED | `CrudService::form()` renders `crud/form` with inline `initialConfig` (L2.2, commit `328285c`); all 11 migrated pages switched to `XCrud::form()` one-liners and their per-page shells deleted (Phase 3, commits `5c1293e`…`5a13e4a`) |
| 7 | Settings 422 never inline | ✅ FIXED | `use-settings-form.ts:204-208` maps per-field; `settings-form-page.tsx:202` renders |
| 8 | `lib/form-flags.ts` dead code | ✅ FIXED | `resources/js/lib/` holds only `settings.ts`, `utils.ts` |
| 9 | Orphans missed by cleanup | ✅ FIXED | 7 orphan files deleted (L1.1, commit `551d5fd`); the unit-group hook/fields went with the Phase 7 migration (commit `babb5c9`) — no legacy form orphans remain |
| 10 | `architecture.md` overstates coverage | ✅ FIXED | coverage claim corrected and refreshed: all dashboard CRUD resources (including products, customers, users, and procurements) render on the `crud/form` shell via `docs/plans/backend-driven-completion/` |
| 11 | Blanket `strip_tags()` vs RichTextEditor | ✅ FIXED | per-field allowed-tags sanitization (`CrudService.php`, `Options.php`, `UserOptions.php`; commit `bf3bdc7`), categories description allowlist (commit `9688994`) |
| 12 | FilePicker clears value on failure | ✅ FIXED | `config-form/file-picker.tsx:37-39` (no `onChange(null)`), `:18-20` (preview resync) |
| 13 | Registry name-hijack (`'code'` key) | ✅ FIXED | `'code'` registration removed (`code-generator-field.tsx`); `CouponCrud` declares `component: 'codeGenerator'` explicitly (`CrudInput::text(..., $component)`); pinned by `field-renderer.test.tsx` |
| 14 | 13 pre-existing Pest failures | 🟡 PARTIAL | Phase 6 fixes landed (commits `5dfa00f`, `a96771c`, `fc03539`); 2 failures remain in the working tree (`AuthenticationTest`, `PasswordConfirmationTest`) and trace to the uncommitted auth WIP on the branch — re-verify once that lands |

---

## 🔴 High — user-breaking

### 1. Adding a reward rule while *editing* a reward system fails the save (500)

- `resources/js/components/forms/config-form/rules-editor-field.tsx:22` — `addRule()` stamps new rules with `id: Date.now()`.
- `app/Crud/RewardSystemCrud.php::afterPut()` treats *any* rule carrying an `id` as pre-existing: `RewardSystemRule::findOrFail($rule['id'])` → `ModelNotFoundException` → whole save fails.
- Adding rules on *create* (`afterPost`) is fine — it ignores ids. The legacy editor sent new rules **without** an id.

**Fix:** new rules must carry no `id` (use `undefined` and strip it from the payload, or a client-only sentinel removed by `buildCrudPayload`).

### 2. Sub Account select on transaction-accounts pages is unusable — `option-loader.ts` is dead-wired

- `resources/js/components/forms/config-form/option-loader.ts` (`loadFieldOptions`, incl. the `refresh.watch` sibling-watcher from commit `6e0e06a`) is imported **only by its own test**; `ConfigForm`/`FieldRenderer` never call it.
- `app/Crud/TransactionAccountCrud.php:181-194` returns `sub_category_id` as `searchSelect` with `options: []` + `refresh: {url, watch: 'category_identifier', data: {exclude}}`.
- On the migrated `dashboard/accounting/accounts/create|edit` pages the field renders **zero options** (on edit the stored sub-account shows blank), and changing the Main Account never reloads options.

**Fix:** wire the loader into `FieldRenderer`/`ConfigForm` (with the watcher) — or pre-populate options server-side.

### 3. The documented payload contract ("backend drops `''`/`null`, `0`/`'0'` survive") is false — the backend filter is a tautology

- `app/Traits/SbForms.php:152`: `if ( ! empty( $value ) || (int) $value === 0 )`.
- Verified with PHP: `''`, `null`, `false`, `0`, `'0'`, `[]` — **everything is kept** (`(int)'' === 0`, `(int)null === 0`, `(int)false === 0`).
- The false claim is repeated in `resources/js/types/forms.ts`, `resources/js/api/crud.ts`, `resources/js/components/forms/config-form/sb-crud-form.tsx` ("empty modal fields are simply omitted"), and `docs/agents/architecture.md` §Payload contract.
- Consequences today: `buildCrudPayload` submits `''` for every optional untouched field on create (rows get `''` instead of omitted), and unchecking a checkbox (`onChange(checked ? '1' : '')`) stores `''`. Nothing crashes yet, but the guarantee the whole engine leans on does not exist.

**Fix:** change the PHP to `$value !== null && $value !== ''` (deliberately rescuing `0`/`'0'`/`false`) — or correct the docs — and add a Pest test pinning empty-vs-zero semantics.

---

## 🟠 Medium — wrong behavior / fragile invariants

### 4. `datetime` fields display blank for existing records

- `field-renderer.tsx` feeds raw model values into `<Input type="datetime-local">` (coupon `valid_until`, `valid_hours_start/end`; transaction dates).
- DB strings (`'2026-01-01 10:00:00'`) or Carbon-JSON (`'...T00:00:00.000000Z'`) are both invalid for `datetime-local` → the browser renders the field **empty on edit**; users may re-enter values, and the seeded value round-trips as-is.

**Fix:** a value formatter (`Y-m-d\TH:i`) on hydrate and de-formatter on submit.

### 5. `useSettingsForm.save()` deletes any tab field it can't resolve — enforced by nothing

- `use-settings-form.ts::save()` resolves each tab field with flat → dot-key → nested-tab → **`null`**, and `SettingsPage::saveForm` treats `null` as **DELETE**.
- Audit confirmed it is *currently* safe: every form field exists in `getPayload()` for all 8 settings pages, and no field name is duplicated across tabs.
- But one future settings page with a payload/form mismatch — or two tabs sharing a field name (the flat-key write path in `setFieldValue` is shared) — silently wipes option rows on every save.
- Also note `getPayload()` shapes are inconsistent across pages (nested for General/Pos/Invoice; **flat** for Accounting/Orders/Workers/Customers/Reports) — it works only because of the resolution priority.

**Fix:** add a Pest test: for each settings page, every tab field must exist in payload, and field names must be unique across tabs.

### 6. `initialConfig` prop is dead — every migrated CRUD page fetches its config client-side

- No controller passes `initialConfig` (e.g. `CustomersController::createCoupon()` passes only title/description), so `useCrudForm` always falls to `crudApi.formConfig()` on mount: loading spinner → extra `GET /api/crud/{ns}/form-config/{id}` round-trip → double permission check (`allowedTo` runs again server-side).

**Fix:** pass the config from controllers as Plan B §B2.3 intended — or drop the prop and its types.

### 7. Settings 422 errors never surface inline

- `useSettingsForm.save()` only toasts the failure; there is no per-field error mapping (unlike `useCrudForm`), so pages with real rules (workers/invoices/reports email) lose inline feedback.

---

## 🟡 Low / hygiene

### 8. `lib/form-flags.ts` is stale dead code

- Zero consumers, all 22 flags `false`, and the legacy JSX it was supposed to gate was deleted anyway (commit `96d9872`). The plan's "pages must remain switchable for immediate fallback" safety net does not exist.

**Fix:** delete the file or wire it for real.

### 9. Orphans missed by the cleanup commit

- `resources/js/pages/dashboard/units/use-unit-form.ts`, `resources/js/pages/dashboard/units/unit-form-fields.tsx`, `resources/js/pages/dashboard/categories/category-form-fields.tsx` have **no importers** (Phase 6's "no dangling imports / remove legacy components" only partially done).

### 10. `architecture.md` overstates coverage

- "Standard backend-driven `ConfigForm` covers all other CRUD and settings resources" — still hand-written: `units/groups/*`, `cash-registers/create|edit`, `customers/create|edit`, `users`, plus the sanctioned products exception.
- Also `CustomerCrud`/`UserCrud` (billing/shipping tabs with duplicate field names) cannot be safely driven by `ConfigForm` + `getFlatForm` (later-tab-wins flattening collapses shipping over billing) if anyone migrates them. `ProcurementCrud` has the same main-name/tab-name duplication.

### 11. `RichTextEditor` vs `CrudService::submitRequest`'s `strip_tags()`

- The editor's contract says "backend is responsible for sanitising on save", but the backend strips **all** tags with no allowlist — migrated ckeditor fields (e.g. category description) silently lose all formatting on save.

**Fix:** allowlist tags per field, or downgrade the editor's promise.

### 12. `FilePicker` clears the value on upload failure

- `onChange(null)` in the catch path; combined with settings' null-=-delete semantics, a transient upload error can wipe a stored logo on the next save. Also `preview` does not resync when the external `value` prop changes.

### 13. Registry name-hijack footguns

- `code-generator-field.tsx` registers under the field *name* `code` (any future `code` field in any Crud gets a Generate button; `Math.random().toString(36)` codes can collide — the server `unique` rule catches it, but the UX is poor).
- `rules`-editor is root-key-sniffed in `ConfigForm` (`(config.form as Record)['rules']`).
- Contained today (only `CouponCrud`/`RewardSystemCrud`) but easy to trip.

### 14. Pre-existing backend suite is red (not this branch) — FIXED (Phase 6)

- ~~13 failures in `Auth/PasswordReset`, `EmailVerification`, `Registration`, `ProfileUpdate`, `PasswordUpdate` (mail/notification expectations). `git log` shows those areas untouched since early commits — but the plan's verification loop gate (`php artisan test`) cannot go green until they are fixed or quarantined.~~
- **Resolution** (`docs/plans/backend-driven-leftovers/06-phase-6-pest-suite-green.md`): `php artisan test` is now **53 passed / 0 failed / 0 skipped**. Production bugs fixed: `DateService` null-safe user language resolution (unguarded `Auth::user()->attribute->language` crashed every timestamped save for users without a `UserAttribute` row, plus a bogus `'light'` fallback); missing `password_reset_tokens` table (the reset broker wrote to a table no migration ever created — core + update migrations added); `UsersService::setUser` ignored its own `$roleToUse` fallback and 500'd registration when `sb_registration_role` was unset; `CrudService` daterangepicker compared bare `Y-m-d` endDate against midnight (excluded the whole last day) and array filter values (multiselect) crashed instead of applying as `whereIn`; test bootstrap now mirrors a fresh install (update migrations assumed-executed, permission gates re-registered post-migration). Stale Breeze scaffolding aligned to the product: username login/registration (registration ships disabled via `sb_registration_enabled`), profile settings edit `username` (the SPA previously bound a nonexistent `name` attribute and saved nothing), and the email-verification tests were removed with the feature (no `MustVerifyEmail`, no `email_verified_at` column — routes remain as inert scaffolding).

---

## ✅ Checked and sound

- No duplicate field names across tabs in **any** settings page (scripted check); the 5 POS payload orphans (`idle_counter`, `disbursement`, `default_change_payment_type`, `tax_group`, `tax_type`) are conditional fields — benign, they are simply not re-sent.
- No unsupported field types in any Crud consumed by the engine; `CouponCrud`'s array fields are `skippable` + handled by relation hooks (no `strip_tags(array)` crash).
- Submit flow is correct end-to-end: nested `{main, tabId:{…}}` body → `getFlatForm` → fillable assignment → `afterPost/afterPut` → JSON `{status, message, redirect, entry}`; `useCrudForm` maps `tabId.field` 422 keys onto the dot-keyed values (`CrudValidationErrorsContractTest` proves the key convention).
- `SbCrudForm` inline-create modal, `ConfigForm` client validation (`required/min/max/numeric/integer/email` with server-authoritative leftovers), `isDirty`/null-delete in settings, `entryToOption` merging for freshly created entries — all behave as documented.
- Products remain the sanctioned bespoke exception (Plan B §B3.b), and its dead props were pruned per the phase-5 decision.

---

## Addendum — tab `identifier` bug (post-audit verification, CONFIRMED)

> Reported externally and verified end-to-end: backend tabs without an `identifier` key render blank in `ConfigForm` and silently drop user edits.

**Root cause chain (all verified):**

1. **Backend**: 24 of 37 Cruds build `tabs` as raw arrays whose tab objects carry only `{label, fields}` — no `identifier` key. `CrudForm::tab()` *does* emit `identifier` (`app/Classes/CrudForm.php:30`), so the 13 Cruds using the factory are fine. Affected Cruds (scripted scan): `CustomerAccountCrud`, `CustomerCouponCrud`, `CustomerGroupCrud`, `CustomerRewardCrud`, `HoldOrderCrud`, `OrderInstalmentCrud`, `PartiallyPaidOrderCrud`, `ProcurementCrud`, `ProcurementProductCrud`, `ProductCategoryCrud`, `ProductHistoryCrud`, `ProductUnitQuantitiesCrud`, `ProviderCrud`, `ProviderProcurementsCrud`, `ProviderProductsCrud`, `RegisterCrud`, `RegisterHistoryCrud`, `RewardSystemCrud`, `RolesCrud`, `TaxCrud`, `TaxesGroupCrud`, `UnitGroupCrud`, `UnpaidOrderCrud`, `UserCrud`.
2. **Engine-migrated impact**: 6 of the 11 migrated CRUD resources are broken — **categories** (`ProductCategoryCrud`), **customer groups** (`CustomerGroupCrud`), **rewards** (`RewardSystemCrud`), **roles** (`RolesCrud`), **taxes** (`TaxCrud`), **tax groups** (`TaxesGroupCrud`) — plus **`UnitGroupCrud`** embedded as the `sbCrudForm` inline-create modal inside the units pages. The 5 resources using `CrudForm::tab()` (units, coupons, transactions, transaction-accounts, payment types) are unaffected, which is why only some pages show the bug.
3. **Frontend**: `config-form.tsx:234` uses `Object.values(config.form.tabs ?? {})`, discarding the dictionary key → `tab.identifier === undefined`. Meanwhile `initialValuesFromConfig`, `buildCrudPayload`, and `validateConfigForm` all use `Object.entries` (dictionary keys) — so rendering and state disagree.
4. **Radix behavior** (verified against the installed `@radix-ui/react-tabs` source): the Root applies `defaultProp: defaultValue ?? ""` → internal value is `""`; Trigger/Content compute `isSelected = value === context.value` → `undefined !== ""` → nothing active, `Presence present={false}` → **content unmounted (blank area)**. Activation is focus-based (`onFocus → onValueChange`); after a manual click `onValueChange(undefined)` sets context to `undefined`, and `undefined === undefined` matches — which is why the tab works after clicking but not on load.
5. **Data consequences (proven by an empirical vitest run against the real `ConfigForm` with a backend-shaped fixture)**:
   - No tab is active on mount → the tab body never mounts (blank).
   - Seeded defaults are not displayed: `TabFields` reads `values["undefined.<field>"] ?? ''` → `''` (a seeded switch value of `'0'` highlights neither option).
   - User edits are written to `values["undefined.<field>"]`; on submit `buildCrudPayload` reads `values["general.<field>"]` → **submits the seeded value instead of the user's edit — silent stale-data submission**.
   - Client-side validation (`validateConfigForm`) also reads dictionary-key values → validates seeded values, not user input → required-field gating is bypassed for edited fields.
   - React "unique key" warnings from `key={undefined}` on `TabsTrigger`/`TabsContent`.

**Why the suites stayed green**: both frontend fixtures (`tests/unit/config-form.test.tsx:34`, `use-crud-form.test.ts`) hardcode `identifier: 'general'`, and `CrudFormConfigContractTest` asserts only field `name`/`type` — no tab `identifier` assertion anywhere.

**Remedy (in-repo precedent exists — commit `89ac6ec` fixed the identical bug for settings):**

1. **Backend (primary)**: in `CrudService::getFormConfig`, normalize each tab after the `@getForm` Hook filter: `$tab['identifier'] = $tab['identifier'] ?? $tabKey`. Keeps the contract boundary truthful (`FormTabDef.identifier` is required).
2. **Frontend (defensive)**: `config-form.tsx` — replace `Object.values(...)` with `Object.entries(...).map(([key, tab]) => ({ ...tab, identifier: tab.identifier ?? key }))`, exactly like `getTabsList` in `settings-form-page.tsx`/`use-settings-form.ts`. Extract one shared helper instead of a third copy. A controlled `<Tabs value onValueChange>` (as proposed) also works, but once identifiers are guaranteed, `defaultValue={tabs[0]?.identifier}` is sufficient.
3. **Regression guards (missing today)**: extend `CrudFormConfigContractTest` to assert every tab has a string `identifier`; add a vitest rendering `ConfigForm` with a fixture **without** `identifier` (blank-on-mount, defaults visible, edits survive submit).

---

## Suggested fix order

Tab-identifier addendum → 1 → 2 → 3 (contract) → 4 → 5 (guard test) → 7 → then the hygiene batch (6, 8, 9, 10).

Items 1, 2, and 4 need code changes in the engine/fields; item 3 is a backend one-liner plus a contract test.




