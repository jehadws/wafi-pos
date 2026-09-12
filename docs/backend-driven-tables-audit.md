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


