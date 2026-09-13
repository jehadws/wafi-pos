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

## Phase 5 — Secondary page route plan (T5.1, 2026-09-13)

Re-check of every secondary namespace against `routes/web/*.php` and `resources/js/pages/**` (post-T4 state). Backend GOTO/POPUP urls unchanged unless listed below; the executing agent invents no other URL changes.

| Namespace | SPA target | State → decision |
|---|---|---|
| `sb.coupons-orders-history` | `/dashboard/customers/coupons/history/{coupon}` | Route + `CustomersController::couponHistory` one-liner already exist (from #5). No page file (generic `crud/list`). Cleanup: the CUD serializes a broken Edit GOTO (`$slug = '/'` → `/dashboard//edit/{id}`) and a Delete that `beforeDelete` always 403s (`delete => false`) — strip both; fix `getLinks()` to the coupons list. |
| `sb.customers-coupons-history` | `/dashboard/customers/{customer}/coupons/{customerCoupon}/history` | Route + one-liner exist. Same cleanup as above (dead Edit/Delete, `getLinks()` → the owning customer's coupons page via `request()->route('customer')`). |
| `sb.customers-orders` | `/dashboard/customers/{customer}/orders` | Route exists; page is bespoke (`customers/orders/page.tsx`) → migrate to `CustomerOrderCrud::table(queryParams: ['customer_id' => …])`; delete the hand page. |
| `sb.customers-rewards` | `/dashboard/customers/{customer}/rewards` | Route exists; page bespoke → `CustomerRewardCrud::table(queryParams: ['customer_id' => …])`; delete the hand page. The Edit GOTO interpolates `{customer_id}` through `getSlug()` + `request()->query('customer_id')` — works once scoping params reach the request (see scoping fix below). |
| `sb.customers-account-history` | `/dashboard/customers/{customer}/account-history` | Route exists; page bespoke → `CustomerAccountCrud::table(queryParams: ['customer_id' => …])`; delete the hand page. Fix the Edit GOTO (`$slug` produces `/dashboard/customers/account-history/edit/{id}` — the route needs the customer segment): build it from `customers/{entry->customer_id}/account-history/edit/{id}`. Create/edit form routes already exist and stay. |
| `sb.orders-instalments` | `/dashboard/orders/instalments` | Standalone list (menu-linked), not an orders-popup. Page bespoke → `OrderInstalmentCrud::table()`; delete the hand page. The CUD's Edit GOTO targets `/dashboard/orders/instalments/edit/{id}` — no such route (and no per-instalment form backend-side): strip Edit + dead Delete from `setActions` (row cosmetics stay). |
| `sb.products-histories` | `/dashboard/products/{product}/history` | Route + `ProductsController::productHistory` one-liner exist (drop the dead Blade `sb-crud-footer` hook with them). Register the `sb.products-histories::sb.description` POPUP in the popup registry (it has no `url`; an unregistered POPUP falls back to `router.visit('javascript:void(0)')`). |
| `sb.global-products-history` | `/dashboard/products/stock-flow-records` | Page bespoke (`stock-flow-records.tsx`, already a hand-rolled crud list) → `GlobalProductHistoryCrud::table()`; delete the hand page. Fix `$slug` (`'/products/history'`) and `getLinks()` list/create to the real page (`/dashboard/products/stock-flow-records`). |
| `sb.products-units` | `/dashboard/products/{product}/units` | Route + `ProductsController::productUnits` one-liner already exist. API consumers (POS/procurement) call `GET /api/crud/sb.products-units` directly and are untouched. Nothing to migrate. |
| `sb.providers-procurements` | `/dashboard/providers/{provider}/procurements` | Route + one-liner already exist (T4.6). Nothing to migrate; verification only. |
| `sb.providers-products` | `/dashboard/providers/{provider}/products` | Route + one-liner already exist (T4.6). The `procurements` scope is an **array** — verify the scoping fix handles it (see below). |
| `sb.cash-registers-history` | `/dashboard/cash-registers/history/{register}` | Route + `CashRegistersController::getRegisterHistory` one-liner already exist (T4.7 target). Register the `sb.cash-registers-history::view-details` POPUP (content-only, no `url`). |
| `sb.transactions-history` (dashboard) | `/dashboard/accounting/transactions/history` | Page bespoke (plain list: columns + row delete + bulk delete — no per-account balances UI) → `TransactionsHistoryCrud::table()`; delete the hand page. The per-transaction history page (`/history/{transaction}`) is already the generic shell. |
| `sb.hold-orders` | POS only | Consumed by `components/pos/orders-dialog.tsx` through `GET /api/crud/sb.hold-orders`. **No dashboard page** — documented, nothing to build. |
| `sb.users` sub-lists | `/dashboard/users/{user}/orders` · `/rewards` · `/coupons` · `/account-history` | **All four missing** — T5.3 builds the routes + one-liner controllers (same customer-domain CUDs, scoped `customer_id = user->id`; users are rows of `subul_users`) and restores the four GOTOs in `UserCrud::setActions` (identifiers `customers_orders`/`customers_rewards`/`customers_coupons`/`customers_history`, URLs as recorded in T1.7). |

**Scoping-mechanism finding (blocks every sub-list, fix lands before the pages):** the SPA sends sub-list scoping keys **inside the `queryFilters` JSON** (T2.2 contract, pinned by `crud-table-engine.test.tsx`), but every sub-list `hook()` reads `request()->query('<param>')` — null for those requests. Unguarded hooks then add `where <param> is null`, which ANDs with the JSON-branch `where <param> = value` → **empty tables on first load** (verified: `ProviderProcurementsCrud` produces `where "provider_id" is null and "provider_id" = ?`). Array-valued scopes (`sb.providers-products` `procurements`) additionally crash the JSON-branch plain `where` with an array operand. Fix: `CrudService::getEntries()` merges every non-declared, non-empty `queryFilters` key into the request query bag **before `hook()` runs**, and the JSON branch skips undeclared array values (hooks own multi-value scopes). Standalone-param calls (Blade-era, contract tests) keep working.

**Phase 5 results (T5.2–T5.4, 2026-09-13):** executed as recorded in the table above, with one deliberate widening agreed during review: every CUD whose row/bulk delete was provably dead (`delete => false`, so `beforeDelete`/`bulkAction` always throw `NotAllowedException`) lost its dead Delete row action and dead `delete_selected` bulk entry. Bulk lists keep their override but return `Hook::filter($this->namespace . '-bulk', [])`, so third-party modules can still register their own bulk actions. Files: `CouponOrderHistoryCrud`, `CustomerCouponHistoryCrud`, `CustomerRewardCrud` (Edit kept — the `/customers/{customer}/rewards/edit/{reward}` route exists), `RegisterHistoryCrud`, `ProductHistoryCrud` (Description POPUP kept), `ProductUnitQuantitiesCrud`, `OrderInstalmentCrud`, `GlobalProductHistoryCrud`, `ProviderProductsCrud` (Edit GOTO retargeted to `/dashboard/procurements/products/edit/{id}` — the only existing per-row edit form; dead Delete stripped). CUDs with real delete permissions (`TransactionsHistoryCrud`, `CustomerOrderCrud`, `CustomerCouponCrud`, `CustomerAccountCrud`, `ProviderProcurementsCrud`, `OrderCrud`, …) keep their bulk actions untouched; the `bulkAction()` server handlers stay everywhere as a direct-API safety net.

Slug/link fixes on top of the table: `GlobalProductHistoryCrud` slug → `products/stock-flow-records`, `TransactionsHistoryCrud` slug → `accounting/transactions/history`, `ProviderProductsCrud` slug → `providers`, `CouponOrderHistoryCrud`/`CustomerCouponHistoryCrud` slug → `customers/coupons`; `ProviderProcurementsCrud`/`ProviderProductsCrud` breadcrumb lists → `dashboard/providers`; `OrderInstalmentCrud` `edit`/`post`/`put` links → `false` (no routes back them); `ProductsController::productHistory` now uses a typed `Product $product` route binding instead of `Product::find()`. Registered POPUPs: `sb.cash-registers-history::view-details` (row fields, no URL) and `sb.products-histories::sb.description` (row description, no URL); `sb.products::sb.quantities` intentionally keeps its URL so the unregistered fallback still navigates to the product edit page.

Verification: the three CRUD contract tests are green; the full backend suite stays at the 13 pre-existing baseline failures (none new); frontend `crud-table-engine.test.tsx` (57 tests) green; `tsc --noEmit` clean. The four customer sub-list pages and the instalments/stock-flow/transactions-history pages are deleted; `routes/web-base.php` keeps the user's own uncommitted `modules.php` include — excluded from all Phase-5 commits.

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

---

## Phase 4 — Wave 2 parity results (T4.10)

**Migrated to `CrudTablePage` (hand `page.tsx` deleted, controller = `return XCrud::table();`):**

| Step | Page | Namespace | Notable hard paths exercised |
|---|---|---|---|
| T4.1 | procurements | `sb.procurements` | Conditional GET + confirm (Set Paid, unpaid rows only) + Refresh GET — **bugs #2/#3 die** (executor honors backend `confirm`) |
| T4.2 | accounting/transactions | `sb.transactions` | Gains **Trigger** (GET + confirm) and **History** (GOTO → existing `TransactionsHistoryCrud::table()` target) |
| T4.3 | customers/coupons | `sb.customers-coupons` | History GOTO target already live (`CouponOrderHistoryCrud::table()` at `/dashboard/customers/coupons/history/{coupon}`) — **T5.2 prerequisite already satisfied; bug #4 dies** |
| T4.4 | customers | `sb.customers` | Widest action set (Edit, Orders, Rewards, Coupons, Wallet History, Delete) — every GOTO target verified against `routes/web/customers.php` |
| T4.5 | users | `sb.users` | **The four sub-list GOTOs (Orders/Rewards/Coupons/Wallet History) are omitted backend-side** — their URLs (`/dashboard/users/{id}/…`) resolve to no SPA route (rule 6); restored by T5.3 when the routes/pages exist |
| T4.6 | providers | `sb.providers` | Gains **See Procurements / See Products** — targets already render backend-driven sub-list tables |
| T4.7 | cash-registers | `sb.cash-registers` | Gains **Register History** GOTO (target route exists); **delete is now row-conditional backend-side** (`RegisterCrud::setActions` omits it for opened registers; `beforeDelete` remains the server-side net) |
| T4.8 | orders | `sb.orders` | POPUP registry first live use (`sb.order-options`, conditional `sb.order-refunds` with iframe print); row `$cssClass` payment-status colors; server pagination on the busiest table (default sort from `OrderCrud`); Invoice/Receipt GOTOs per the T1.7 finding (SPA pages, plain `router.visit`) |

**Engine extension (T4.8 prerequisite, its own commit):** `daterangepicker` and `text` query-filter types are now first-class toolbar controls — `filterableColumns` is a discriminated union; daterange serializes to the backend `{ startDate, endDate }` shape (both bounds required, `CrudService.php:848-858`), text passes the scalar through the filter's `operator` (`like`). All types flow through the tanstack `columnFilters` channel (`onColumnFiltersChange` + toolbar Reset unchanged).

**Products (T4.9) — decision: kept bespoke.** The optional cheap adoption (swap the hand dropdown for `row-actions-menu` + executor) was **not taken**: the bespoke page's rows come from its own hand query and carry no `$actions`, so wiring the executor would force the crud list round-trip onto the page — exactly the "touching columns/queries" the plan excludes. Preview (`sb.quantities` POPUP — falls back to navigation until a popup component exists), See Quantities and See History GOTOs stay unexposed on the bespoke page; the hand dropdown keeps Copy ID/Edit/Delete. Recorded as the sanctioned bespoke exception (tables B3.b-analog).

**Bug verification (T4.10):**
- **#2 / #3 (Set Paid / Refresh without confirm) — die.** The procurements hand menu is deleted; `ProcurementCrud::setActions` serializes both GETs with `confirm`, and the executor renders it (also for already-paid rows: the backend omits Set Paid per-row). Both endpoints answer JSON `{status, message}` → success toast + refresh; `SbRestrictMiddleware` 403s surface through the executor's error toast (no navigation).
- **#4 (stub coupon History) — dies.** The stub `toast.info` item is deleted with the hand page; the real History GOTO renders from `$actions` and lands on the live coupon-history table.

**Regression pass (T4.10):** `npm run types` + `npm run lint` green (zero warnings); `npm run test` 393/393 (43 files). `php artisan test`: **13 failed / 31 passed — identical to the Phase 3 baseline** (pre-existing Auth env failures; no CRUD regressions). `CrudEntryActionsContractTest` + `CrudTableConfigContractTest` green after the `RegisterCrud`/`UserCrud` action edits. `npm run test:e2e` smoke: 4/4 checkout journeys pass. Payload spot-check: orders + procurements now load through `GET /api/crud/{ns}` with `per_page=20` server pagination (previously whole-dataset Inertia props / client-driven fetches).

**Deferrals with written reasons:**
1. **Users sub-list actions** (Orders/Rewards/Coupons/Wallet History) — omitted backend-side until T5.3 builds `/dashboard/users/{id}/…` routes + generic pages (would 404 otherwise).
2. **Products page** — bespoke exception retained (T4.9 decision above).

---

## Post-migration status (Phase 6 close-out — 2026-09-13)

**Project exit criteria: MET.** Every dashboard list page is backend-driven or a recorded sanctioned exception; all 9 audit bugs are resolved; the contract + vitest suites guard the engine; docs updated.

### Bugs #1–#9 — all resolved

| # | Bug | Where it died |
|---|---|---|
| 1 | Duplicate "Copy ID" menu item (units) | Phase 3 T3.10 — hand page deleted; the engine appends exactly one built-in Copy ID per row menu |
| 2 | Set Paid without confirmation | Phase 4 T4.1 — hand menu deleted; `ProcurementCrud` serializes GET + `confirm`; the executor renders it |
| 3 | Refresh without confirmation | Phase 4 T4.1 — same mechanism as #2 |
| 4 | Stub coupon History (`toast.info`) | Phase 4 T4.3 — the real History GOTO renders from `$actions`; target table live since T5.2 |
| 5 | `GlobalProductHistoryCrud` delete serialized as GOTO | Phase 1 action normalization; Phase 5 then stripped the dead Delete entirely (`delete => false`) |
| 6 | `CouponOrderHistoryCrud` "hitory" URL typo | Phase 1 backend fix — zero `hitory` matches remain under `app/` |
| 7 | Inconsistent delete confirmation text | Phase 1 T1.6 standardized payloads backend-side; Phase 3 T3.10 renders them verbatim |
| 8 | No permission filtering on the frontend | Solved at source — `CrudEntry::filterActions()` (rows) + `getFilteredLinks()` (toolbar); pinned by contract tests |
| 9 | Inconsistent delete API methods | Phase 3 T3.10 — all deletes resolve `del(action.url)` → `DELETE /api/crud/{ns}/{id}`; bulk likewise |

### Final page migration table

Every controller list method is a one-liner (`return XCrud::table();`); the hand `page.tsx` shells were deleted wholesale — the single generic `resources/js/pages/crud/list.tsx` renders everything. Waves: **1** = Phase 3 (T3.1–T3.10), **2** = Phase 4 (T4.1–T4.8), **3** = Phase 5 (T5.2–T5.4) + T6.1. Sub-lists are scoped via `queryParams`; secondary/history pages render the generic page directly (most never had a bespoke file).

| Page | Namespace | Wave |
|---|---|---|
| `/dashboard/units` | `sb.units` | 1 |
| `/dashboard/units/groups` | `sb.units-groups` | 1 |
| `/dashboard/taxes` | `sb.taxes` | 1 |
| `/dashboard/taxes/groups` | `sb.taxes-groups` | 1 |
| `/dashboard/customers/groups` | `sb.customers-groups` | 1 |
| `/dashboard/accounting/accounts` | `sb.transactions-accounts` | 1 |
| `/dashboard/accounting/transactions/accounts` | `sb.transactions-accounts` | 1 |
| `/dashboard/orders/payments-types` | `sb.payments-types` | 1 |
| `/dashboard/products/categories` | `sb.products-categories` | 1 |
| `/dashboard/customers/rewards-system` | `sb.rewards-system` | 1 |
| `/dashboard/users/roles` | `sb.roles` | 1 (`90245d3`) |
| `/dashboard/procurements` | `sb.procurements` | 2 (T4.1) |
| `/dashboard/accounting/transactions` | `sb.transactions` | 2 (T4.2) |
| `/dashboard/customers/coupons` | `sb.coupons` | 2 (T4.3, `10cef4e`) |
| `/dashboard/customers` | `sb.customers` | 2 (T4.4) |
| `/dashboard/users` | `sb.users` | 2 (T4.5) |
| `/dashboard/providers` | `sb.providers` | 2 (T4.6) |
| `/dashboard/cash-registers` | `sb.cash-registers` | 2 (T4.7) |
| `/dashboard/orders` | `sb.orders` | 2 (T4.8) |
| `/dashboard/customers/{customer}/orders` | `sb.customers-orders` (scoped) | 3 |
| `/dashboard/customers/{customer}/rewards` | `sb.customers-rewards` (scoped) | 3 |
| `/dashboard/customers/{customer}/coupons` | `sb.customers-coupons` (scoped) | 3 |
| `/dashboard/customers/{customer}/account-history` | `sb.customers-account-history` (scoped) | 3 |
| `/dashboard/customers/{customer}/coupons/{customerCoupon}/history` | `sb.customers-coupons-history` (scoped) | 3 (T5.2) |
| `/dashboard/customers/coupons/history/{coupon}` | `sb.coupons-orders-history` (scoped) | 3 (T5.2) |
| `/dashboard/customers/coupons-generated` | `sb.customers-coupons` | 3 (generic page; never a bespoke file) |
| `/dashboard/users/{id}/orders` | `sb.customers-orders` (scoped) | 3 (T5.3) |
| `/dashboard/users/{id}/rewards` | `sb.customers-rewards` (scoped) | 3 (T5.3) |
| `/dashboard/users/{id}/coupons` | `sb.customers-coupons` (scoped) | 3 (T5.3) |
| `/dashboard/users/{id}/account-history` | `sb.customers-account-history` (scoped) | 3 (T5.3) |
| `/dashboard/providers/{provider}/procurements` | `sb.providers-procurements` (scoped) | 3 |
| `/dashboard/providers/{provider}/products` | `sb.providers-products` (scoped) | 3 |
| `/dashboard/orders/instalments` | `sb.orders-instalments` | 3 |
| `/dashboard/products/{product}/history` | `sb.products-histories` (scoped) | 3 |
| `/dashboard/products/{product}/units` | `sb.products-units` (scoped) | 3 |
| `/dashboard/products/stock-flow-records` | `sb.global-products-history` | 3 |
| `/dashboard/accounting/transactions/history` | `sb.transactions-history` | 3 |
| `/dashboard/cash-registers/history/{register}` | `sb.cash-registers-history` (scoped) | 3 |
| `/dashboard/procurements/products` | `sb.procurements-products` | 3 (T6.1) |

Sanctioned non-migrations (remaining `page.tsx` files): `/dashboard/products` — bespoke tables exception (B3.b-analog); `/dashboard/medias` and `/dashboard/accounting/rules` — not CRUD-table-backed resources; `/dashboard/orders/invoice` + `/dashboard/orders/receipt` — Inertia GOTO *target* pages, not lists; `/dashboard/products/print-labels` + `/dashboard/products/stock-adjustment` — bespoke tools, no list.

### Missing frontend actions — now exposed

Every row of the planning-time "Missing frontend actions" table except the sanctioned products exception:

| Action (audit finding) | Status |
|---|---|
| Roles — Clone (GET) | Exposed (Wave 1) |
| Procurements — Set Paid / Refresh (GET + confirm) | Exposed (Wave 2, T4.1) |
| Transactions — Trigger (GET) / History (GOTO) | Exposed (Wave 2, T4.2) |
| Coupons — History (GOTO) | Exposed (Wave 2, T4.3); target table live (T5.2) |
| Orders — Refund Receipt (conditional POPUP) | Exposed (Wave 2, T4.8 popup registry) |
| Categories — Compute | Exposed (Wave 1) |
| Providers — See Procurements / See Products | Exposed (Wave 2, T4.6); targets live (Phase 5) |
| Cash Registers — Register History | Exposed (Wave 2, T4.7); target table live (Phase 5) |
| Users — Orders / Rewards / Coupons / Wallet History | Exposed (T5.3 routes + generic pages) |
| Products — Preview / Quantities / History | **Not exposed** — bespoke exception; the hand dropdown keeps Copy ID / Edit / Delete |

### Popup registry coverage

| `namespace::identifier` | Coverage |
|---|---|
| `sb.orders::sb.order-options` | Registered — Options modal |
| `sb.orders::sb.order-refunds` | Registered (conditional — serialized only when refunds exist); iframe print |
| `sb.cash-registers-history::view-details` | Registered — row-field dialog (no URL) |
| `sb.products-histories::sb.description` | Registered — row-description dialog (no URL) |
| `sb.hold-orders::sb.open` | POS-handled — never rendered on a dashboard list |
| `sb.products::sb.quantities` | Intentionally unregistered — the navigate fallback (dev-time warning) reaches the product edit page |

### Final deferrals / sanctioned exceptions

1. **Products list page** — bespoke (tables B3.b-analog): its hand-built rows carry no `$actions`; wiring the executor would force the crud-list round-trip onto the page. Preview/Quantities/History GOTOs stay unexposed there.
2. **Medias manager and accounting rules** — not CRUD-table-backed resources; out of the engine's scope by design.
3. **Client-only columns dropped in Wave 1** (`displays_on_pos` / `total_items` / `base_unit` buckets) — candidates for `getQueryFilters()` if the need resurfaces (carried from the Phase 3 notes).
4. **Users sub-list actions** — the T4.10 deferral is **closed**: T5.3 built the routes + generic pages, so the four GOTOs ship on `UserCrud` rows.
5. **Translation legacy drift** — pre-existing `ar-old` / `de` under-maintenance recorded in the verification evidence below; intentionally not repaired ("fix nothing unrelated").

### Phase 6 verification evidence (2026-09-13)

- `npm run types` + `npm run lint` — green, zero warnings (re-run after formatting).
- `npm run test` — 43 files / **393 tests green**, including the ambient-type guard and the table contract suites (`crud-table-engine.test.tsx`, `use-action-executor` tests, `api-modules` / `api-transactions` contract tests).
- `php artisan test` — **13 failed / 34 passed (7309 assertions)**. The 13 failures are the pre-existing Auth/Settings env baseline (Authentication, EmailVerification ×4, PasswordReset ×3, Registration ×2, Dashboard visit, PasswordUpdate, ProfileUpdate ×2) — failure count identical to the Phase 3/4 baseline; the passed count grew 31 → 34 from the contract tests added in Phases 1–5. Zero CRUD regressions.
- `npm run test:e2e` — **4/4 checkout journeys pass** (7.1s). The plan's optional dashboard CRUD Playwright smoke was not added: list/sort/search/delete-with-confirm and popup/pagination behavior are pinned by the engine unit suites (`crud-table-engine`, `use-action-executor`), so the cheap-e2e condition was not met and this note stands as the manual-smoke record.
- `npm run translation:check` — every string this plan introduced is present in both maintained locales (`Copy ID`, `Confirm Your Action`, `Customer Orders/Rewards/Coupons`, `Account History`, `Display All Product Stock Flow`, `Display All Procurement Products` — verified in `en.json` + `ar.json`). Remaining checker failures are pre-existing legacy drift unrelated to the tables plan: `ar-old` stale since `b14c51d` (888 missing / 767 code-missing / 2208 unused), `de` never fully maintained (845 missing + 26 duplicates — receipt-template strings from the forms plan), and `ar` missing 4 keys from the pre-plan POS create-customer form (`c19f57d`) plus 3 extra legacy keys. Recorded, not repaired.
- `npm run format` — clean: `prettier --write resources/` reports zero formatting drift at the close-out HEAD (formatting was already satisfied by the Phase 6 verification commit `912c737`); types + lint re-ran green after it.

### Cross-links

- Architecture: `docs/agents/architecture.md` — layer-map `components/tables/crud-table/` row, the **Backend-driven tables engine** section (rendering spine, payload contract, JSON-only toast rule, coverage & exceptions), ripple map, and known-debt #8.
- Plans: `docs/plans/backend-driven-tables/01` (backend contract) → `02` (engine) → `03` (Wave 1) → `04` (Wave 2) → `05` (history & secondary pages) → `06` (this close-out).




