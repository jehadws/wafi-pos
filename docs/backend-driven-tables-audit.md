# Backend-driven tables audit

> Planning-time audit for the "backend-driven tables" phase (successor to `docs/backend-driven-forms-audit.md`).
> Source: static review of the backend action system (`app/Services/CrudEntry.php`, `app/Services/CrudService.php`, `app/Crud/*`), the 21 dashboard list pages (`resources/js/pages/dashboard/**`), and the action target routes (`routes/api/*`, `routes/web/*`).
> **Scope decision (approved): Option A — full backend-driven tables.** Config-driven columns + server-side pagination/search/sort from `GET /api/crud/{ns}` + generic action rendering from `CrudEntry::$actions`.

---

## Fundamental disconnect

The backend defines a typed action system — `CrudEntry::action($label, $identifier, $url, $confirm, $type, $permissions)` (`app/Services/CrudEntry.php:70`) — that serializes into `$actions` on **every row**, and is already **permission-filtered server-side** (`CrudEntry::filterActions()`, `jsonSerialize()`). The frontend ignores this data entirely: every list page hardcodes its own `<DropdownMenu>` with hardcoded URLs, hardcoded action logic, and its own confirmation dialogs. There is no generic action renderer.

The table *shape* is equally backend-defined and equally ignored:
- `GET /api/crud/{ns}/config` (`CrudController@getConfig:250-286`) returns `columns`, `queryFilters`, `labels`, `links` (permission-filtered via `getFilteredLinks`), `bulkActions`, `prependOptions`, `showOptions`, `showCheckboxes`, `headerButtons`.
- `GET /api/crud/{ns}` (`crudList` → `CrudService::getEntries`) returns a **Laravel paginator** with server-side `?page, per_page, search, active, direction, queryFilters` support (`CrudService.php:815-930`), rows carrying `$actions`, `$cssClass` (row status colors), `__raw`.
- Today's pages instead consume hand-built queries passed as **unbounded Inertia props** (e.g. `UnitsController::listUnits` runs `Unit::…->get()`), hand-pick columns, and hand-wire every action.

## Backend action types (35 CRUD files)

| Type | Count | Frontend handles? |
|---|---|---|
| GOTO | ~40 | Partially — hardcodes `router.get()` with its own URL |
| DELETE | ~30 | Partially — own `ConfirmationDialog` + per-entity API client |
| GET | 6 | No — direct API calls, some without confirmation |
| POPUP | 7 | No — custom hardcoded components |

## Missing frontend actions (not rendered at all)

| Entity | Action | Type | Backend has |
|---|---|---|---|
| Roles | Clone | GET | `/api/users/roles/{id}/clone` (`RolesCrud:360-368`) |
| Procurements | Set Paid | GET | `/api/procurements/{id}/set-as-paid` (`ProcurementCrud:431-441`) |
| Procurements | Refresh | GET | `/api/procurements/{id}/refresh` (`ProcurementCrud:443-451`) |
| Transactions | Trigger | GET | `/api/transactions/trigger/{id}` (`TransactionCrud:448-452`) |
| Coupons | History | GOTO | `/dashboard/customers/coupons/history/{id}` |
| Orders | Refund Receipt (conditional) | POPUP | `/dashboard/orders/refund-receipt/{id}` (`OrderCrud:406-413`) |
| History CUDs | Various | GOTO/POPUP | Multiple pages |
| Categories | Compute | (backend) | Missing on `categories/page.tsx` |
| Providers | See Procurements / See Products | (backend) | Missing on `providers/page.tsx` |
| Cash Registers | History | (backend) | Missing on `cash-registers/page.tsx` |
| Users | Orders / Rewards / Coupons / Wallet History | (backend) | Missing on `users/page.tsx` |
| Products | Preview / Quantities / History | (backend) | Missing on `products/page.tsx` |

## Bugs found

| # | Bug | File |
|---|---|---|
| 1 | Duplicate "Copy ID" menu item | `units/page.tsx` |
| 2 | No confirmation on Set Paid (destructive) | `procurements/page.tsx` |
| 3 | No confirmation on Refresh | `procurements/page.tsx` |
| 4 | Stub History action (just `toast.info`) | `customers/coupons/page.tsx` |
| 5 | `GlobalProductHistoryCrud` delete uses GOTO type instead of DELETE | Backend `GlobalProductHistoryCrud.php` |
| 6 | `CouponOrderHistoryCrud` URL typo ("hitory" missing 's') | Backend `CouponOrderHistoryCrud.php` |
| 7 | Inconsistent delete confirmation text across pages | All list pages |
| 8 | No permission filtering on frontend — all actions shown to all users | All list pages |
| 9 | Inconsistent delete API methods — some `entityApi.remove()`, others `crudApi.remove()` | Mixed |

## Per-page action comparison

| Entity | Backend actions | Frontend actions | Mismatch |
|---|---|---|---|
| Products | Edit, Preview(POPUP), Quantities, History, Delete | Copy ID, Edit, Delete | Missing: Preview, Quantities, History |
| Orders | Options(POPUP), Refund Receipt(POPUP), Invoice, Receipt, Delete | Options, Copy Code, Invoice, Receipt, Delete | Missing: Refund Receipt |
| Customers | Edit, Orders, Rewards, Coupons, Wallet History, Delete | Edit, Orders, Rewards, Coupons, Wallet History, Delete | Aligned (missing Copy ID) |
| Users | Edit, Orders, Rewards, Coupons, Wallet History, Delete | Edit, Delete | Missing: Orders, Rewards, Coupons, Wallet History |
| Roles | Edit, Clone(GET), Delete | Copy ID, Edit, Delete | Missing: Clone |
| Transactions | Edit, History, Trigger(GET), Delete | Copy ID, Edit, Delete | Missing: History, Trigger |
| Procurements | Edit, Invoice, Set Paid(GET), Refresh(GET), Delete | Copy ID, Edit, Invoice, Set Paid, Refresh, Delete | Set Paid/Refresh missing confirm |
| Cash Registers | Edit, History, Delete | Edit, Delete (disabled when opened) | Missing: History |
| Coupons | Edit, History, Delete | Copy ID, Edit, History(stub), Delete | History is a stub |
| Categories | Edit, Compute, Delete | Copy ID, Edit, Delete | Missing: Compute |
| Providers | Edit, See Procurements, See Products, Delete | Copy ID, Edit, Delete | Missing: See Procurements, See Products |
| Payment Types | Edit, Delete | Edit, Delete | Aligned |
| Taxes | Edit, Delete | Copy ID, Edit, Delete | Aligned (extra Copy ID) |
| Units | Edit, Delete | Copy ID(x2), Edit, Delete | Duplicate Copy ID |
| Unit Groups | Edit, Delete | Copy ID, Edit, Delete | Aligned |
| Customer Groups | Edit, Delete | Copy ID, Edit, Delete | Aligned |
| Tax Groups | Edit, Delete | Copy ID, Edit, Delete | Aligned |
| Transaction Accounts | Edit, Delete | Copy ID, Edit, Delete | Aligned |

## Summary

| Category | Count | Details |
|---|---|---|
| Actions missing from frontend | 12+ | Clone, Trigger, History, Preview, Quantities, Compute, See Procurements/Products, Refund Receipt, … |
| Actions with wrong behavior | 2 | Set Paid/Refresh missing confirmation dialogs |
| Bugs | 9 | Duplicate menu items, stubs, typos, permission gaps, type errors |
| Pages fully aligned | 6 | Customers, Payment Types, Taxes, Unit Groups, Customer Groups, Tax Groups |

---

## Additional findings during planning (beyond the pasted audit)

1. **GOTO actions that point at API URLs.** `TransactionsHistoryCrud:356-360` ("Create Reflection") is `GOTO` → `api/transactions/history/{id}/create-reflection`; navigating the SPA to an API endpoint is wrong. These must be reclassified backend-side (→ `GET` + confirm), not worked around in the frontend. `HoldOrderCrud` "Continue" (`sb.open`) needs the same review.
2. **Action labels embed raw HTML icons.** e.g. `OrderCrud:391` `'<i class="mr-2 las la-cogs"></i> ' . __('Options')`, `ProductCrud:743`. A generic renderer would render HTML from the backend — sanitize during the normalization sweep: plain `__()` labels only; icons become an optional dedicated key later if wanted.
3. **Delete confirm text is inconsistent backend-side too.** Nearly all CRUDs send `confirm: ['message' => __('Would you like to delete this ?')]` without a `title`. Standardizing in the CRUD files (message + `title => 'Confirm Your Action'` — key already translated in all `lang/*.json`) makes the frontend consistent for free and fixes bug #7 at the source.
4. **Bug #8 is already solved at the source.** `CrudEntry::filterActions()` strips actions the user lacks permission for on serialization; the `config` endpoint's `links` are filtered via `getFilteredLinks`. The frontend just needs to render what arrives — no client-side permission filtering for row actions.
5. **Unbounded lists.** Every list page loads its whole dataset through Inertia props; `GET /api/crud/{ns}` paginates server-side (default `per_page=20`). Option A fixes this but changes UX (server pagination) — `DataTable` already supports it (`useCustomPagination`, `useServerSideSearch`).
6. **Row cosmetics already ride along.** `$cssClass` (e.g. `OrderCrud` payment-status colors) and `__raw` come with each entry; the engine must apply `$cssClass` to `<TableRow>` and ignore `__raw`.
7. **GET endpoints return redirects for non-XHR.** `CrudController::crudDelete` returns JSON when `expectsJson` (axios sends `X-Requested-With` — good); some GET action endpoints respond `redirect()->back()` → HTML body. The executor must toast only when the response is JSON with a `message`, otherwise treat as success + refresh.

## Bug → resolution map

| Bug | Dies where |
|---|---|
| 1, 7, 9 | Phase 3 (Wave 1) — generic `row-actions-menu` + single executor replace per-page code |
| 2, 3 | Phase 2 (`use-action-executor` honors backend `confirm`) + Phase 4 procurements |
| 4 | Phase 4 coupons + Phase 5 coupon-history page (target exists check, `01` T1.7) |
| 5, 6 | Phase 1 backend fixes |
| 8 | Already handled by `CrudEntry::filterActions()`; verified by contract test in Phase 1 |

---

## Decision log (approved 2026-09-12)

| Decision | Call |
|---|---|
| Data source | **Option A — full backend-driven**: server-paginated/searched/sorted rows from `GET /api/crud/{ns}`, columns from `GET /api/crud/{ns}/config` |
| Copy ID | One uniform built-in menu item appended to every row menu (fixes duplicate/missing/extra mismatches); never per-page |
| Products table | Sanctioned bespoke exception (mirrors forms decision B3.b); revisit after Wave 2 |
| POPUP strategy | Component registry keyed `namespace::identifier` with navigate fallback |
| Confirm texts | Standardized backend-side in the CRUD files; frontend renders `confirm` verbatim |
| Missing action targets | Expose only after the target page/route exists (Phase 1 inventory → Phase 5 build-out) |
| Render wrapper | **Revive `CrudService::table()`** (dead `View::make` at `CrudService.php:1149`) as the Inertia render wrapper over `getTableConfig()` — controllers become `return XCrud::table();` |
| Generic page | **One single `pages/crud/list.tsx`** renders every migrated list; migrated hand-written `page.tsx` files are deleted wholesale, never converted to shells |
| Actions channel | Row `$actions` only — no separate `getActionConfig()` endpoint (permission filtering is per-serialization in `CrudEntry::filterActions()`; actions are row-conditional) |
| Column rendering | Ladder: default text (values pre-cast backend-side) → optional backend `type` key on the column → `namespace::identifier` renderer registry; never infer from identifier names |
| Data loading | Server-side only — rows are never Inertia props; config travels once as `initialConfig` from `table()`; sub-list scoping via `queryParams` → `initialQuery` |

## List-page inventory (21 pages → namespaces)

| SPA page | Namespace |
|---|---|
| `dashboard/units/page.tsx` | `sb.units` |
| `dashboard/units/groups/page.tsx` | `sb.units-groups` |
| `dashboard/categories/page.tsx` | `sb.products-categories` |
| `dashboard/taxes/page.tsx` | `sb.taxes` |
| `dashboard/taxes/groups/page.tsx` | `sb.taxes-groups` |
| `dashboard/accounting/accounts/page.tsx` | `sb.transactions-accounts` |
| `dashboard/accounting/transactions/page.tsx` | `sb.transactions` |
| `dashboard/accounting/transactions/history.tsx` | `sb.transactions-history` |
| `dashboard/orders/page.tsx` | `sb.orders` |
| `dashboard/orders/payments-types/page.tsx` | `sb.payments-types` |
| `dashboard/customers/page.tsx` | `sb.customers` |
| `dashboard/customers/groups/page.tsx` | `sb.customers-groups` |
| `dashboard/customers/coupons/page.tsx` | `sb.customers-coupons` |
| `dashboard/customers/rewards-system/page.tsx` | `sb.rewards-system` |
| `dashboard/users/page.tsx` | `sb.users` |
| `dashboard/users/roles/page.tsx` | `sb.roles` |
| `dashboard/providers/page.tsx` | `sb.providers` |
| `dashboard/procurements/page.tsx` | `sb.procurements` |
| `dashboard/procurements/products/page.tsx` | `sb.procurements-products` |
| `dashboard/products/page.tsx` | `sb.products` |
| `dashboard/cash-registers/page.tsx` | `sb.cash-registers` |

History/secondary CUD namespaces without confirmed SPA pages (Phase 5 inventory): `sb.coupons-orders-history`, `sb.customers-coupons-history`, `sb.customers-account-history`, `sb.customers-orders`, `sb.orders-instalments`, `sb.products-histories`, `sb.global-products-history`, `sb.products-units`, `sb.providers-procurements`, `sb.providers-products`, `sb.cash-registers-history`, `sb.hold-orders`.

---

## Phase 1 sweep (T1.6, 2026-09-12) — action normalization

### GET-action route audit
| Action | Endpoint | Enforcement |
|---|---|---|
| Procurement Set Paid | GET `procurements/{procurement}/set-as-paid` | `SbRestrictMiddleware('subul.update.procurements')` on route ✅ |
| Procurement Refresh | GET `procurements/{id}/refresh` | `SbRestrictMiddleware('subul.update.procurements')` on route ✅ |
| Role Clone | GET `users/roles/{role}/clone` | `sb()->restrict(['create.roles'])` in `cloneRole` ✅ |
| Transaction Trigger | GET `transactions/trigger/{transaction?}` | **was unguarded** → added `sb()->restrict(['subul.update.transactions'])` in controller ✅ |
| Create Reflection | GET `transactions/history/{history}/create-reflection` | **was unguarded** → added `sb()->restrict(['subul.create.transactions'])` in controller ✅ |

No GOTO action points at an `api/` URL (the former "Create Reflection" GOTO already serializes as `GET` + confirm), so no GOTO→GET reclassification was needed.

### POPUP action registry (component registry keys for Phase 2)
| `namespace::identifier` | Source | Label | URL | Expected behavior |
|---|---|---|---|---|
| `sb.orders::sb.order-options` | OrderCrud | Options | `/dashboard/orders/edit/{id}` | Order options modal |
| `sb.orders::sb.order-refunds` | OrderCrud (only when refunds exist) | Refund Receipt | `/dashboard/orders/refund-receipt/{id}` | Refund receipt print modal |
| `sb.products::sb.quantities` | ProductCrud | Preview | `/dashboard/products/edit/{id}` | Product preview modal (identifier predates the Preview label) |
| `sb.cash-registers-history::view-details` | RegisterHistoryCrud | Details | — (content-only) | Register history details modal |
| `sb.hold-orders::sb.open` | HoldOrderCrud | Continue | — (POS-handled) | Restores the held order into the POS |

### Confirm payload standardization
All 29 `DELETE` actions now use `'title' => __('Confirm Your Action')` + `'message' => __('Would you like to delete this ?')`; resources with a semantic message keep it (rewards system, transactions history). Copy-paste titles removed (`Delete a licence` on coupons / customer groups / rewards system, `Delete a customers`, `Delete a user`). GET-action confirms (set-paid, refresh, clone, trigger, create-reflection) intentionally keep message-only payloads. No HTML-bearing labels remain in `app/Crud` (verified by grep and pinned by the T1.2 contract test).

## Action-target inventory (T1.7, 2026-09-12)

Every GOTO action resolved against `routes/web/*.php`. Verdicts: **✅ exists**, **❌ missing** (no matching route), **⚠️ broken URL** (route shape exists but the URL can never match).

| Namespace | Action | URL | Verdict |
|---|---|---|---|
| `sb.coupons` | Edit | `/dashboard/customers/coupons/edit/{id}` | ❌ missing (no such route) |
| `sb.coupons` | History | `/dashboard/customers/coupons/history/{id}` | ❌ missing (route is `/customers/{customer}/coupons/{coupon}/history`) |
| `sb.coupons-orders-history` | Edit | `/dashboard//edit/{id}` | ⚠️ broken (`$slug = '/'`) — resource has no SPA page (Phase 5) |
| `sb.customers-account-history` | Edit | `/dashboard/customers/account-history/edit/{id}` | ❌ missing (route requires `/customers/{customer}/account-history/edit/{id}`) |
| `sb.customers-coupons` | Usage History | `/dashboard/customers/{customer_id}/coupons/{id}/history/` | ✅ exists |
| `sb.customers-coupons` | Edit | `/dashboard/customers/coupons-generated/edit/{id}` | ❌ missing |
| `sb.customers-coupons-history` | Edit | `/dashboard//edit/{id}` | ⚠️ broken (`$slug = '/'`) — no SPA page (Phase 5) |
| `sb.customers` | Edit / Orders / Rewards / Coupons / Wallet History | `/dashboard/customers/…` | ✅ all exist |
| `sb.customers-groups` | Edit | `/dashboard/customers/groups/edit/{id}` | ✅ exists |
| `sb.customers-rewards` | Edit | `/dashboard/customers/{customer_id}/rewards/edit/{id}` | ⚠️ broken — literal `{customer_id}` placeholder is never interpolated; resolves only by accident |
| `sb.orders` | Invoice | `/dashboard/orders/invoice/{id}` | ✅ exists — **Inertia page** (`dashboard/orders/invoice/page`), safe for `router.visit` |
| `sb.orders` | Receipt | `/dashboard/orders/receipt/{id}` | ✅ exists — **Inertia page** (`dashboard/orders/receipt/page`), safe for `router.visit` |
| `sb.orders` | Refund Receipt (POPUP) | `/dashboard/orders/refund-receipt/{refund}` | ✅ exists — **direct Blade HTML** (`View::make`) → must open in a **new tab**, never `router.visit` |
| `sb.orders-instalments` | Edit | `/dashboard/orders/instalments/edit/{id}` | ❌ missing (only the list route `/orders/instalments` exists) |
| `sb.payments-types` | Edit | `/dashboard/orders/payments-types/edit/{id}` | ✅ exists |
| `sb.procurements` | Edit / Invoice | `/dashboard/procurements/edit/{id}[/invoice]` | ✅ both exist |
| `sb.procurements-products` | Edit | `/dashboard/procurements/products/edit/{id}` | ✅ exists |
| `sb.products-categories` | Edit / Compute Products | `/dashboard/products/categories/edit/{id}` · `/compute-products/{id}` | ✅ both exist |
| `sb.products` | Edit / See Quantities / See History | `/dashboard/products/edit/{id}` · `/{id}/units` · `/{id}/history` | ✅ all exist |
| `sb.providers` | Edit / See Procurements / See Products | `/dashboard/providers/edit/{id}` · `/{id}/procurements` · `/{id}/products` | ✅ all exist |
| `sb.providers-products` | Edit | `/dashboard//dashboard/providers/edit/{id}` | ⚠️ broken (`$slug = '/dashboard/providers'` double-prefixes) |
| `sb.cash-registers` | Edit / Register History | `/dashboard/cash-registers/edit/{id}` · `/history/{id}` | ✅ both exist |
| `sb.rewards-system` | Edit | `/dashboard/customers/rewards-system/edit/{id}` | ✅ exists |
| `sb.roles` | Edit | `/dashboard/users/roles/edit/{id}` | ✅ exists |
| `sb.taxes` / `sb.taxes-groups` | Edit | `/dashboard/taxes[/groups]/edit/{id}` | ✅ exists |
| `sb.transactions` | Edit / History | `/dashboard/accounting/transactions/edit/{id}` · `/history/{id}` | ✅ both exist |
| `sb.transactions-accounts` | Edit | `/dashboard/accounting/accounts/edit/{id}` | ✅ exists |
| `sb.units` / `sb.units-groups` | Edit | `/dashboard/units[/groups]/edit/{id}` | ✅ exists |
| `sb.users` | Edit | `/dashboard/users/edit/{id}` | ✅ exists |
| `sb.users` | Orders / Rewards / Coupons / Wallet History | `/dashboard/users/{id}/orders|rewards|coupons|account-history` | ❌ all missing (users.php has no sub-list routes) |

**Scheduling (rule 6):** the ❌ targets on namespaces that already have a host page — `sb.coupons` (Edit/History), `sb.customers-account-history` (Edit), `sb.customers-coupons` (Edit), `sb.orders-instalments` (Edit), `sb.users` sub-lists — must be built (or the actions removed) in **Phase 5 before their host page migrates**. The ⚠️ broken-URL CRUDs are all Phase 5 resources without SPA pages today; fix `$slug` when their pages are created.

## Phase 3 — Wave 1 parity results (T3.1–T3.10, 2026-09-12)

The 10 simple/aligned list pages are fully backend-driven. Each controller's list method is now the one-liner shell over its CRUD's `table()` (`return ProductCategoryCrud::table();`), and the hand page is deleted — the shared engine renders rows, columns, and actions. Page → CRUD mapping:

| SPA page (hand shell deleted) | Namespace | Controller list method |
|---|---|---|
| `dashboard/units/page.tsx` | `sb.units` | `UnitController::listUnits` |
| `dashboard/units/groups/page.tsx` | `sb.units-groups` | `UnitController::listUnitGroups` |
| `dashboard/taxes/page.tsx` | `sb.taxes` | `TaxController::listTaxes` |
| `dashboard/taxes/groups/page.tsx` | `sb.taxes-groups` | `TaxController::listTaxGroups` |
| `dashboard/customers/groups/page.tsx` | `sb.customers-groups` | `CustomersController::listGroups` |
| `dashboard/accounting/accounts/page.tsx` | `sb.transactions-accounts` | `TransactionsHistoryController::listAccountsCrud` |
| `dashboard/accounting/transactions/accounts/page.tsx` | `sb.transactions-accounts` | `TransactionsHistoryController::listAccountsCrud` |
| `dashboard/orders/payments-types/page.tsx` | `sb.payments-types` | `PaymentsTypesController::listPaymentsTypes` |
| `dashboard/categories/page.tsx` | `sb.products-categories` | `CategoryController::listCategories` |
| `dashboard/customers/rewards-system/page.tsx` | `sb.rewards-system` | `RewardsSystemController::list` |

**Exit criteria met:**
1. All 10 pages fully backend-driven — server-paginated (`per_page=20`) + server search + server sort from `GET /api/crud/{ns}` with `initialConfig` traveling once from `table()`. Previously 8 of them loaded whole datasets client-side; only `sb.transactions-accounts` and `sb.payments-types` were already server-paginated.
2. No hand-written dropdowns/columns remain on them — every row menu is the built-in `row-actions-menu` (exactly one **Copy ID** per menu, backend-defined labels/icons/targets), every column comes from `getColumns()`.
3. No client-side permission filtering — server-side `CrudEntry::filterActions()` (row actions) + `getFilteredLinks()` (toolbar links); pinned by `CrudEntryActionsContractTest` (contract tests green).

**Bug verification (T3.10):**
- **#1 duplicate Copy ID — dies.** The hand `units/page.tsx` (the only page with a hand Copy ID) is deleted; the engine appends exactly one built-in Copy ID per row menu. Verified: no `copy-id` remains outside `row-actions-menu.tsx` across the 10 namespaces.
- **#7 inconsistent delete confirm text — dies.** All 10 namespaces serialize the T1.6-standardized payload (`Confirm Your Action` / `Would you like to delete this ?`); the executor renders it verbatim with no hand override. Resource-specific messages (rewards system) keep them per rule 3 with a constant title.
- **#9 inconsistent delete API methods — dies.** All row-menu deletes resolve `del(action.url)` → `DELETE /api/crud/{ns}/{id}`; the hand pages' split `entityApi.remove()` / `crudApi.remove()` paths are gone with the deleted pages. Bulk deletes resolve the same way against the bulk `DELETE` endpoint.

**Parity notes & accepted deviations (columns/actions reconciled to the backend as source of truth):**
1. **Payment types:** readonly entries no longer serialize a Delete row action (`PaymentTypeCrud::setActions` omits Delete when `readonly`), and bulk delete keeps its server-side readonly guard — the hand page never filtered this.
2. **Author columns renamed:** `author_name` (hand subqueries) → `user_username` / `subul_users_username` (relation-hydrated); labels unchanged ("Author").
3. **Yes/No cosmetics:** `active` / `readonly` (payment types) and `displays_on_pos` (categories) render backend-defined Yes/No strings; the hand Badge styling was client-only.
4. **Bulk labels backend-defined:** "Delete Selected Groups" (most CRUDs) / "Delete Selected Rewards" replace the hand "Delete Selected"; Add-New/Refresh ride from `config.links` (permission-filtered).
5. **Client-only columns dropped:** the hand pages' client-side filterable columns (`displays_on_pos` / `total_items` buckets on categories, `base_unit` on units) and client-side name lookups (category parent) have no server counterpart (`getQueryFilters()` empty) — dropped per "backend is the single source of truth"; recorded as candidates for `getQueryFilters()` in a later phase if the need resurfaces.
6. **Roles:** name/namespace/created_at parity; the permission checkboxes live on the separate Permission Manager page — no loss on the list.

**Regression pass (T3.10):** `npm run types` + `npm run lint` + `npm run test` green (43/43). `php artisan test`: **13 failed / 31 passed — identical to the Phase 3 baseline** (pre-existing Auth/Settings/Dashboard license-restriction env failures; no CRUD regressions). `CrudTableConfigContractTest` and `CrudEntryActionsContractTest` green.



