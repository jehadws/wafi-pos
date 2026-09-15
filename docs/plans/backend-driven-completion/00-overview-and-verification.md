# Backend-Driven Completion — 00: Overview & Verification Results

*Directory: `docs/plans/backend-driven-completion/`*
*Sequence: Step 0 of 9 — read me first*

> Branch: `feat/backend-driven-tables`.
> This plan suite picks up where `docs/plans/backend-driven-leftovers/` ended. The leftovers plan declared customers / users / procurements **blocked** (its Phase 8) and products list/form **sanctioned bespoke** (B3.b-analog). This suite un-blocks and migrates them all, plus polishes the two remaining `any`-typed order print pages. Scope confirmed with the user: **everything**.

---

## Objective

Finish the backend-driven forms/tables initiative completely:

1. Author a real `ProcurementCrud::getForm` (Phases 1–3) — the current one is a raw attribute dump (`ProcurementCrud.php:142`+: main `name` + a `general` tab repeating `id`, `uuid`, `created_at`, `author`, … as text inputs, duplicating `name`).
2. Migrate the **procurements** create/edit forms onto the generic `crud/form` shell, including the products rows editor as a registry custom field (Phases 1–3).
3. Migrate the **products list** to `ProductCrud::table()` (Phase 4) — the call is already sitting commented out at `ProductsController.php:347`.
4. Migrate the **products form** (spike-gated, Phase 5) using registry custom fields for the complex tabs.
5. Un-block and migrate the **customers** (Phase 6) and **users** (Phase 7) forms — the two remaining Cruds in the `CrudFormConfigContractTest.php:77` duplicate-name allowlist.
6. Polish the **orders** receipt/invoice print target pages: real prop types, no service objects as props (Phase 8).
7. Refresh docs + final verification (Phase 9).

Every phase is atomic: implement → verify (per-phase gate) → commit.

---

## Verified baseline (audited on this branch, per file:line)

### Already backend-driven — do not touch

| Surface | Evidence |
|---|---|
| Orders list (popup Options, conditional Refund Receipt, Invoice/Receipt GOTOs, queryFilters) | `OrdersController::listOrders` → `OrderCrud::table()` (~:103) |
| Orders instalments / payment types | generic `crud/list` shell |
| Procurements list (Set Paid + Refresh GET actions with confirms, provider/author relation columns) | `ProcurementController::listProcurements` → `ProcurementCrud::table()` (:265) |
| 27 other list pages + 11 form resources | per `docs/plans/backend-driven-leftovers/00-overview-and-verification.md` |

### Hand-written surfaces this suite migrates

| Surface | Today | Phase |
|---|---|---|
| Procurement create/edit | `ProcurementController::createProcurement:293` / `::updateProcurement:322` render `dashboard/procurements/create|edit` + `use-procurement-form.ts` + 2 tabs + modals; posts to **dedicated** `/api/procurements` endpoints | 1–3 |
| Products list | `ProductsController::listProducts:342` hand-loads an **unbounded** `Product::addSelect(…)->get()` into a hand `page.tsx`; `// return ProductCrud::table();` commented at :347 | 4 |
| Products form | sanctioned bespoke (`products/create|edit.tsx` + `components/forms/product-form/*` 8 tabs); posts `submitUrl` `/api/products` (prop passed at `ProductsController.php:393`) | 5 (spike-gated) |
| Customers form | `customers/create|edit.tsx` + `use-customer-form.ts` + `customer-form-fields.tsx`; posts nested `{first_name, general, billing, shipping}` to dedicated `customersApi` | 6 |
| Users form | `users/create|edit.tsx` + `use-user-form.ts` + `user-form-fields.tsx` | 7 |
| Orders receipt/invoice pages | Inertia GOTO **target** pages, `any`-typed; `orderReceipt:316-317` passes `optionsService`/`ordersService` **service objects** as props | 8 (polish only — stay bespoke by design) |

### Explicitly out of scope (unchanged)

- `procurements/products/edit.tsx` — L8.3 deferral stands (2-field dedicated endpoint page).
- Procurement invoice print (`/procurements/edit/{procurement}/invoice`), order refund-receipt / payment-receipt popups — print targets, not CRUD.
- POS, stock-adjustment, print-labels, accounting/rules, medias — documented non-CRUD/bespoke surfaces.

## Engine facts this plan relies on (verified)

1. **`CrudService::submitRequest()` (`CrudService.php:262-450`)** — the generic write path. Hook order: `filterPostInputs/filterPutInputs` → `beforePost/beforePut` → (unless `disablePost`/`disablePut`, :304-307) fill `$fillable` + save + tabs-relations save (:378-407) → `afterPost/afterPut` (:413-422) → JSON `{status, message, redirect, entry}` (:431-444). **`disablePost`/`disablePut` is the sanctioned "another handler" mechanism** — the fill/save block is skipped entirely, so a Crud performs its own transactional write inside `beforePost/beforePut`.
2. **`SbForms::getFlatForm` (`SbForms.php:120-172`)** — flattens `{ main, tabId: {…} }` per field name (later tab wins; the reason customers/users/procurements were blocked) **but passes unknown root keys through untouched** (:159-169). Precedent: `RewardSystemCrud::$skippable = ['rules']` (:85) with a root-level `rules` section seeded in `getForm` (:178-184) and synced in `afterPost/afterPut` (:250+).
3. **Validation** — `CrudPostRequest::rules()` (`CrudPostRequest.php:25-54`) extracts rules from the form definition keyed `{tabId}.{fieldName}` (evidence: `attributes()` has `'general.email'`; `UserCrud` uses `'sometimes|same:general.password'`). 422 error keys therefore land as `general.{name}` — exactly the dot-key contract `ConfigForm` expects (`config-form.tsx:14-23`).
4. **`allowedTo(false)` throws (`CrudService.php:1508-1515`)** — `ProcurementCrud::$permissions['update'] = false` (:76) currently makes the edit render (`getFormConfig(entry)`) throw. Flipping `update` to the real permission is a prerequisite, safe because `disablePut` + service delegation keeps the generic PUT from writing directly.
5. **`useCrudForm` ignores `config.submitUrl`** (`use-crud-form.ts:151` always posts to `/api/crud/{ns}`; same in modal `sb-crud-form.tsx:125`) even though `getFormConfig` computes `submitUrl` from `getLinks()['post'/'put']` (`CrudService.php:1490-1495`) and `CrudFormConfig` carries it (`types/forms.ts:125`). Phase 5 closes this gap only if the spike chooses dedicated endpoints for products.
6. **`ConfigForm` payload** — `buildCrudPayload` (`config-form.tsx:48-86`) emits `{ [main]: v, [tabId]: { [fieldName]: v } }` + a **hardcoded** root `rules` special-case (:70-83, :326-343). Phase 2 generalizes that into declarative `customSections`.
7. **Custom field registry** — `registry.ts` (`registerCustomComponent`, self-registering modules, `null` + dev warning when unregistered); whole-tab custom components exist (`FormTabDef.component` → `sbProductGroup`).
8. **`ProductCrud`** — form spike exists (`getForm:166+`, covered by `tests/Feature/ProductCrudSpikeTest.php`); columns + actions defined (`getColumns:682`, `setActions:729-783` — note the mislabeled pair: `sb.quantities` POPUP labeled "Preview" opens the **edit** URL :750-755, while `units` GOTO labeled "See Quantities" opens `/products/{id}/units` :757-762 — Phase 4 reconciles labels/targets with the hand page).

---

## Phase index & execution order

| Phase | Title | Depends on |
|---|---|---|
| 1 | Procurement form definition + write delegation (backend) | — |
| 2 | `procurementProducts` custom field + declarative root sections (frontend) | 1 |
| 3 | Procurement controller sweep + hand-file deletions | 1, 2 |
| 4 | Products list migration (`ProductCrud::table()`) | — |
| 5 | Products form migration (spike → engine `submitUrl` → migrate) | spike report + user decision |
| 6 | Customers form unblock + migration | — |
| 7 | Users form unblock + migration | 6 (same rename pattern) |
| 8 | Orders receipt/invoice polish (typing + prop hygiene) | — |
| 9 | Cleanup, docs & final verification | all |

Phases 4, 6, 8 are independent of the procurement chain and can run in parallel. Phase 7 reuses Phase 6's pattern. Phase 5 gates on its own spike.

---

## Ground rules (every phase)

1. Frontend gate: `npm run types && npm run lint && npm run test` — zero errors, zero warnings.
2. Backend gate: `php artisan test` — fully green (the 13 known failures from the leftovers plan were fixed in its Phase 6).
3. UI strings go through `useTranslation`; new strings require `npm run translation:check`.
4. Commits follow the existing convention (`feat(crud): …`, `feat(forms): …`, `refactor(procurements): …`, `docs: …`, `chore(cleanup): …`).
5. **Stock invariant**: procurements and products writes keep flowing through `ProcurementService` / `ProductService` (single transactional writer). Generic crud endpoints may *render* forms for these resources but must never write procurement/product rows directly — enforced by `disablePost`/`disablePut` (Phase 1) and the Phase 5 spike decision.
6. No behavior change without parity: every deleted hand page gets a manual before/after checklist in its phase doc (same fields, same payloads, same redirects, same toasts).

