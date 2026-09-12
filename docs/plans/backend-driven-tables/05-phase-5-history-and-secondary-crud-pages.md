# Backend-Driven Tables — 05: Phase 5 — History & Secondary CRUD Pages

*Directory: `docs/plans/backend-driven-tables/`*
*Sequence: Step 5 of 7*

---

## Objective

Build the missing action-target pages discovered by T1.7 **before** the Wave-2 pages that link to them, migrate the existing bespoke secondary lists, and give the remaining secondary CUDs generic pages. This unblocks T4.3 (coupons), T4.4/T4.5 (customer/user sub-lists), T4.6 (providers), T4.7 (register history).

**Secondary CUD namespace inventory** (status to re-verify in T5.1): `sb.coupons-orders-history`, `sb.customers-coupons-history`, `sb.customers-account-history`, `sb.customers-orders`, `sb.orders-instalments`, `sb.products-histories`, `sb.global-products-history`, `sb.products-units`, `sb.providers-procurements`, `sb.providers-products`, `sb.cash-registers-history`, `sb.hold-orders`.

---

## Micro-Step T5.1: Target-page inventory re-check & route plan

- **Goal**: Finalize which secondary pages exist, which are new, and which URLs the backend GOTOs point at.
- **Implementation Instructions**:
  1. Cross-reference every GOTO/POPUP url (post T1.6 sweep) against `routes/web/*.php` and existing `resources/js/pages/**`.
  2. For each missing target, decide: new route + generic `CrudTablePage` shell (default), or redirect the backend URL to an existing page (if the action's semantics match a current page).
  3. Record the plan in the audit doc's inventory table; the executing agent must not invent URL changes silently — list them here.
- **Commit**: `docs(tables): finalize secondary page route plan`

---

## Micro-Step T5.2: Coupon history page (unblocks T4.3, bug #4)

- **Files**:
  - `[NEW]` route in `routes/web/customers.php`: `GET /customers/coupons/history/{coupon}` → controller renders a generic table page.
  - `[NEW]` `resources/js/pages/dashboard/customers/coupons/history.tsx` — thin `CrudTablePage` shell with `namespace` from the coupon-history CUD (`sb.coupons-orders-history`, corrected in T1.5; and/or `sb.customers-coupons-history` — pick per what `CouponCrud`'s History GOTO points at).
  - `[MODIFY]` the controller method to pass `initialConfig` (scoped by `coupon_id` via the CUD's `hook()` query filter, which already reads `request()->query('coupon_id')` / route binding).
- **Notes**: the GOTO URL carries the coupon id as a path segment — make the route/CUD accept it (query param or route-model binding; adjust `CouponCrud`'s History URL if needed to keep both sides consistent).
- **Commit**: `feat(coupons): add coupon history page to unblock history action`

---

## Micro-Step T5.3: Customer/user & provider sub-list pages

- **Goal**: Pages for the actions restored on Customers/Users/Providers (T4.4–T4.6).
- **Candidate mappings** (verify each against backend GOTO urls):
  - `sb.customers-orders` → customer orders list
  - `sb.customers-account-history` → wallet history list
  - `sb.customers-coupons-history` → per-customer coupon usage
  - `sb.orders-instalments` → instalments (verify whether it belongs to the orders popup instead of a page)
  - `sb.providers-procurements` / `sb.providers-products` → provider sub-lists
- **Implementation Instructions**: one generic `CrudTablePage` route+page per confirmed target (same pattern as T5.2, scoped by the owning entity id); skip and note any target that turns out to duplicate an existing page.
- **Commit**: `feat(tables): add secondary sub-list pages for customers/users/providers actions`

---

## Micro-Step T5.4: Remaining secondary lists

- **Instructions**:
  1. `sb.cash-registers-history` — new generic page (unblocks T4.7 History action).
  2. `sb.products-histories` / `sb.global-products-history` — generic pages (post T1.6 they have correct DELETE/GET actions).
  3. `sb.products-units` — product unit-quantities sub-list (verify current consumers — POS/procurement may call it; do not remove the API).
  4. `dashboard/procurements/products/page.tsx` — exists; migrate to `CrudTablePage` (`sb.procurements-products`).
  5. `dashboard/accounting/transactions/history.tsx` — exists, bespoke UI (balances per account). Migrate only the parts that are plain list behavior; keep bespoke if the page is genuinely custom — record the decision.
  6. `sb.hold-orders` — POS-consumed (held orders). Verify whether any dashboard page is needed; likely none — document.
- **Commit**: `feat(tables): migrate remaining secondary crud lists`
- **Exit Criteria (Phase 5 complete)**: every backend action exposed on a migrated page resolves to an existing, working SPA target.
