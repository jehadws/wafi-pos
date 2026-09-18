# Leftover Work — Phase 3: Controller Sweep to `XCrud::form()`

*Directory: `docs/plans/backend-driven-leftovers/`*
*Sequence: Step 3 of 8*

---

## Objective

Switch every controller method that renders an **already-migrated** CRUD form page from hand-built `Inertia::render('dashboard/...', [props])` payloads to the one-liner `XCrud::form()` / `XCrud::form($entry)`, then delete the 22 per-resource page shells. This resolves audit #6 (`initialConfig` dead → every page fetches config client-side: loading spinner + extra `GET /api/crud/{ns}/form-config/{id}` round-trip) **by construction**, exactly like `CrudService::table()` did for lists.

## Prerequisites

- Phase 2 landed (`pages/crud/form.tsx` exists; `CrudService::form()` returns an Inertia response; `CrudFormRenderTest` green).

---

## Controller map (verified line numbers — re-check before editing)

| Resource (`namespace`) | Controller — create | Controller — edit | Page files to `[DELETE]` |
|---|---|---|---|
| Categories (`sb.products-categories`) | `CategoryController::createCategory` (:236) | `::editCategory` (:249) | `dashboard/categories/create.tsx`, `edit.tsx` |
| Taxes (`sb.taxes`) | `TaxesController` (:195) | (:211) | `dashboard/taxes/create.tsx`, `edit.tsx` |
| Tax groups (`sb.taxes-groups`) | `TaxesController` (:241) | (:254) | `dashboard/taxes/groups/create.tsx`, `edit.tsx` |
| Units (`sb.units`) | `UnitsController` (:182) | (:193) | `dashboard/units/create.tsx`, `edit.tsx` |
| Customer groups (`sb.customers-groups`) | `CustomersGroupsController` (:44) | (:55) | `dashboard/customers/groups/create.tsx`, `edit.tsx` |
| Rewards (`sb.rewards-system`) | `RewardsSystemController` (:38) | (:53) | `dashboard/customers/rewards-system/create.tsx`, `edit.tsx` |
| Coupons (`sb.coupons`) | `CustomersController` (:266) | (:278) | `dashboard/customers/coupons/create.tsx`, `edit.tsx` |
| Payment types (`sb.payments-types`) | `OrdersController` (:469) | (:475) | `dashboard/orders/payments-types/create.tsx`, `edit.tsx` |
| Accounts (`sb.transactions-accounts`) | `TransactionsAccountController` (:45) | (:58) | `dashboard/accounting/accounts/create.tsx`, `edit.tsx` |
| Transactions (`sb.transactions`) | `TransactionController::createTransaction` (:68) | `TransactionController::editTransaction` (:94) | `dashboard/accounting/transactions/create.tsx`, `edit.tsx` |
| Roles (`sb.roles`) | `UsersController` (:291) | (:281) | `dashboard/users/roles/create.tsx`, `edit.tsx` |

---

## Per-resource parity gate (every micro-step)

- [ ] Create route renders the form **without** a client-side config fetch (no `GET /api/crud/{ns}/form-config` in the network tab).
- [ ] Field census: every backend field renders (compare against the old page's fields).
- [ ] Create flow: valid submit creates the model and follows the response `redirect`.
- [ ] Edit flow: stored values populate all fields.
- [ ] 422: required-field errors render inline under the field.
- [ ] `npm run types && npm run lint && npm run test` clean.

## Implementation pattern (identical for every resource)

1. Create: replace the whole `Inertia::render('dashboard/…/create', [...])` block with `return XCrud::form();` — add named args only where the defaults don't fit (e.g. `form(title: __('…'))`).
2. Edit: `return XCrud::form($entry);` where `$entry` is the route-bound model.
3. Delete the two page files. **Before deleting, check what props the page actually read** (`usePage<…>().props`) — most migrated shells read only `title` + `initialConfig`; drop dead controller props (e.g. `CategoryController::editCategory` currently sends `categories` + `category` that only `title` survives).
4. Update/verify breadcrumbs still make sense (Phase 2's default: Dashboard → list title; pass `breadcrumbs:` named arg to preserve richer trails like *Dashboard → Taxes → Create Tax*).
5. Run the parity gate; commit.

---

## Micro-Steps L3.1 – L3.11

One micro-step per table row, in this order (simplest first): **taxes → tax groups → units → customer groups → payment types → accounts → categories → coupons → rewards → roles → transactions**.

- **Commit message template** (per resource):
  ```bash
  git add app/Http/Controllers/Dashboard/<Controller>.php resources/js/pages/dashboard/<dir>/
  git commit -m "feat(forms): render <resource> forms via CrudService::form() (drop per-page shells)"
  ```
- Special cases:
  - **Rewards**: `RewardSystemCrud` carries the root-level `rules` passthrough — confirm the rules editor still receives its data via the embedded `initialConfig` (it did via the API fetch; same payload, now inline).
  - **Coupons**: the `code` field uses the custom generator — confirm the embedded config still names the registry component.
  - **Roles**: the permissions manager page (`dashboard/users/roles/permissions-manager`, `UsersController` :171) is **not** part of this sweep — leave it alone.

## Phase gate

- `grep -rn "Inertia::render('dashboard/" app/Http/Controllers` no longer matches any of the 11 form resources.
- `resources/js/pages/dashboard` contains no `create.tsx`/`edit.tsx` for the 11 resources; `npm run types && npm run lint && npm run test` and `php artisan test` (still 13 known failures max) pass.
