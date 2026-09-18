# Codebase Stabilization — 03: Legacy Blade View Reconciliation

*Directory: `docs/plans/codebase-stabilization/`*
*Sequence: Step 3 of 6*

---

## 1. Objective

Clean up and reconcile dead `View::make()` calls remaining in controllers after the Inertia SPA migration, ensuring every printable receipt, invoice, report, or development route renders properly without throwing `InvalidArgumentException: View [...] not found`.

---

## 2. Audited Surfaces

| Route / Surface | Controller & Method | Target View Missing | Strategy |
|---|---|---|---|
| `/cash-registers/z-report/{register}` | `CashRegistersController::getRegisterZReport` | `pages.dashboard.orders.templates.z-report` | Render Inertia page `dashboard/orders/templates/z-report` or printable HTML response |
| `/orders/refund-receipt/{refund}` | `OrdersController::orderRefundReceipt` | `pages.dashboard.orders.templates.refund-receipt` | Render Inertia page `dashboard/orders/templates/refund-receipt` (analogous to order receipt) |
| `/orders/payment-receipt/{orderPayment}` | `OrdersController::getOrderPaymentReceipt` | `pages.dashboard.orders.templates.payment-receipt` | Render Inertia page `dashboard/orders/templates/payment-receipt` |
| `/procurements/edit/{procurement}/invoice` | `ProcurementController::procurementInvoice` | `pages.dashboard.procurements.invoice` | Render Inertia page `dashboard/procurements/invoice` |
| `/dev` | `DevController::index` | `dev.index` | Return JSON status / redirect to dashboard or drop if deprecated |

---

## 3. Implementation Plan

1. **Orders Print Views (`refund-receipt`, `payment-receipt`)**:
   - Align with `resources/js/pages/dashboard/orders/receipt/page.tsx` pattern.
   - Create corresponding Inertia pages under `resources/js/pages/dashboard/orders/templates/` or migrate to direct Inertia renders.

2. **Cash Register Z-Report (`z-report`)**:
   - Create Inertia view `resources/js/pages/dashboard/orders/templates/z-report.tsx` receiving the structured register totals, opening/closing balances, and sales history.

3. **Procurement Invoice (`procurementInvoice`)**:
   - Create Inertia view `resources/js/pages/dashboard/procurements/invoice.tsx` with printable procurement summary.

4. **Dev Controller (`DevController`)**:
   - Clean up or return a simple json response if only used in local testing environments.

---

## 4. Verification

- Feature tests verifying `GET` requests to all 4 print/report endpoints return `200 OK` with valid Inertia payloads.
- TypeScript compiler (`npm run types`) passes cleanly for new React print templates.
