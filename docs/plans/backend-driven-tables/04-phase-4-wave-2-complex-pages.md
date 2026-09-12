# Backend-Driven Tables — 04: Phase 4 Wave 2 — Complex Pages

*Directory: `docs/plans/backend-driven-tables/`*
*Sequence: Step 4 of 7*

---

## Objective

Migrate the pages that exercise the engine's hard paths: conditional actions (`GET` with confirm), POPUP dialogs, row `$cssClass`, server pagination on the busiest tables, and GOTO targets that depend on Phase 5 pages. Order matters: each step lists its prerequisites.

**Per-page parity gate**: same checklist as Phase 3, plus the per-step notes below.

---

## Micro-Step T4.1: Procurements (`sb.procurements`)

- **Files**: `resources/js/pages/dashboard/procurements/page.tsx` + `ProcurementsController` (list method).
- **Notes**: exercises **GET + confirm** — Set Paid (conditional on unpaid, `ProcurementCrud:431-441`) and Refresh. Confirms already exist backend-side; the executor honors them (fixes bugs #2/#3). Verify `set-as-paid`/`refresh` endpoints + `SbRestrictMiddleware` behave for restricted users (403 → toast, no navigation).
- **Prereq**: T1.6 (labels/confirm normalization), T2.5.
- **Commit**: `feat(procurements): migrate procurements list to CrudTablePage`

---

## Micro-Step T4.2: Transactions (`sb.transactions`)

- **Files**: `resources/js/pages/dashboard/accounting/transactions/page.tsx` + its controller.
- **Notes**: gains **Trigger (GET)** and **History (GOTO)** from `$actions`. History target = `/dashboard/accounting/transactions/history` (exists — `history.tsx`); it stays a bespoke page until Phase 5.
- **Commit**: `feat(transactions): migrate transactions list to CrudTablePage`

---

## Micro-Step T4.3: Coupons (`sb.customers-coupons`)

- **Files**: `resources/js/pages/dashboard/customers/coupons/page.tsx` + its controller.
- **Notes**: **History is a GOTO** to `/dashboard/customers/coupons/history/{id}` — blocked on the Phase 5 coupon-history page (T5.2) per rule 6 of `00`. Until T5.2 lands, either migrate without exposing History (confirm with product owner) or defer this page. Replaces the stub `toast.info` action (bug #4).
- **Prereq**: T5.2.
- **Commit**: `feat(coupons): migrate coupons list to CrudTablePage`

---

## Micro-Step T4.4: Customers (`sb.customers`)

- **Files**: `resources/js/pages/dashboard/customers/page.tsx` + its controller.
- **Notes**: widest action set (Edit, Orders, Rewards, Coupons, Wallet History, Delete). Verify each GOTO target exists (T1.7); the sub-list targets may be Phase 5 pages (`sb.customers-orders`, `sb.customers-account-history`, …). CustomerCrud list query joins roles — reconcile with `getColumns()`.
- **Commit**: `feat(customers): migrate customers list to CrudTablePage`

---

## Micro-Step T4.5: Users (`sb.users`)

- **Files**: `resources/js/pages/dashboard/users/page.tsx` + its controller.
- **Notes**: restores the four missing actions (Orders, Rewards, Coupons, Wallet History) — these are customer-scoped sub-lists of the *user*; verify their URLs resolve to existing routes, else schedule Phase 5 pages. UserCrud is a large CRUD — expect column reconciliation work (`getColumns()` at `UserCrud:659+`).
- **Commit**: `feat(users): migrate users list to CrudTablePage`

---

## Micro-Step T4.6: Providers (`sb.providers`)

- **Files**: `resources/js/pages/dashboard/providers/page.tsx` + its controller.
- **Notes**: gains **See Procurements** / **See Products** (GOTOs to provider-scoped sub-lists — verify targets; likely Phase 5 pages `sb.providers-procurements` / `sb.providers-products`).
- **Commit**: `feat(providers): migrate providers list to CrudTablePage`

---

## Micro-Step T4.7: Cash Registers (`sb.cash-registers`)

- **Files**: `resources/js/pages/dashboard/cash-registers/page.tsx` + its controller.
- **Notes**: gains **History** (GOTO — target page may be Phase 5 `sb.cash-registers-history`). The "delete disabled when opened" behavior must come from the backend omitting/adding the action per row — verify `RegisterCrud::setActions` (row-conditional actions are allowed and encouraged; they're part of the contract).
- **Commit**: `feat(registers): migrate cash registers list to CrudTablePage`

---

## Micro-Step T4.8: Orders (`sb.orders`)

- **Files**: `resources/js/pages/dashboard/orders/page.tsx` + `OrdersController` (list method).
- **Notes**: the engine stress test —
  1. **POPUP registry first use**: `sb.order-options` and conditional `sb.order-refunds`; build the popup components (fetch `/dashboard/orders/edit/{id}` / `refund-receipt/{id}` content) and register them (T2.6).
  2. **`$cssClass` rows** (payment-status colors) must render on `<TableRow>`.
  3. **Server pagination** on the largest table — verify `per_page` default and query performance; `OrderCrud` has a custom default sort (`OrderCrud:364-366`).
  4. Invoice/Receipt are print targets — behavior per T1.7 finding (likely new-tab).
- **Prereq**: T2.6, T1.7.
- **Commit**: `feat(orders): migrate orders list to CrudTablePage with popup actions`

---

## Micro-Step T4.9: Products (`sb.products`) — decision gate

- **Files**: `resources/js/pages/dashboard/products/page.tsx` (bespoke, sanctioned exception per the forms decision B3.b).
- **Decision**: **keep bespoke for now.** Optional, cheap adoption: swap only the hardcoded dropdown for `row-actions-menu` + executor (gains Preview/Quantities/History POPUPs without touching columns/queries). Only do this if it doesn't force popup components to be built (they'd navigate via fallback until built).
- **Commit** (if adopted): `feat(products): adopt row-actions-menu on bespoke products list`

---

## Micro-Step T4.10: Wave 2 regression pass

- **Instructions**:
  1. Full verification loop + `npm run test:e2e` smoke on orders + procurements.
  2. Confirm bugs #2, #3, #4 (pending T5.2 status) and all Wave-2 "missing actions" are live.
  3. Measure list payloads (network tab): confirm server pagination no longer ships whole datasets.
- **Commit**: `docs(tables): record wave 2 parity results in tables audit`
- **Exit Criteria (Phase 4 complete)**: all complex pages backend-driven or explicitly deferred with a written reason.

