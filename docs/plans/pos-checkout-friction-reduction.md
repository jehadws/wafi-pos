# POS Checkout Friction Reduction — Implementation Plan

> Status: **In progress** — Phase 0 (finalization extraction) under way.
> Grounded in a full code audit (see "Verified findings"). File references are exact as of commit `38b5eb1`.

## Goal

A walk-in, single-method sale closes with **zero blocking dialogs** (scan → Pay → done). The payment dialog appears only when it is earning its keep: split tender, change due, non-default method, or unpaid/partial flows.

| Flow | Today | Target |
|---|---|---|
| Walk-in cash, exact | scan → *customer dialog* → *order-type dialog* → payment dialog → submit → confirm(s) | scan → Pay → done. **0 modals** |
| Barcode, single-unit product | scan → quantity keypad dialog → … | scan → added silently → … |
| Split / change / card / unpaid | payment dialog | payment dialog (unchanged) |
| Void | confirm | confirm (kept — genuinely destructive) |

## Design decisions

1. **Customer requirement — use the dormant default-customer setting, not backend surgery.**
   The server cannot accept customer-less orders today: `OrdersService::__customerIsDefined` (`app/Services/OrdersService.php:1790`) → `CustomerService::get(null)` returns a *Collection of all customers*, which breaks `__checkOrderPayments` / `__saveOrderPayments`. Rather than rework backend accounting paths, consume the existing-but-unused `sb_customers_default` (**Default Customer Account**, `app/Settings/CustomersSettings.php:44`, already exposed in POS options at `app/Http/Controllers/Dashboard/OrdersController.php:214` and typed in `resources/js/types/pos.d.ts:17`): when configured, auto-assign that customer to new carts. When unset, keep today's gating. Zero backend changes.
2. **Order type — never block, always have a value.** Auto-assign on cart init: last-used per terminal (localStorage) → else first enabled type. Generalizes the existing single-type auto-select in `resources/js/pages/dashboard/pos.tsx:51-61`. Delivery keeps the shipping row visible (`totals-summary.tsx:130`).
3. **Fast path = explicit affordance + shared finalize pipeline.** "Exact Cash" submits `{identifier:'cash-payment', value: total}` as a single payment with status `paid`, only when the cart is non-empty and no payments exist. **Pay always keeps opening the full dialog** — the fast path never replaces it. All finalize logic (print/drawer/reset) lives in `services/order-finalize.ts`, shared by both paths.
4. **Silent barcode add.** On scan: single unit-quantity → add qty 1 directly; multiple unit-quantities → existing unit picker. Gate behind `sb_subul_quick_product` / `sb_subul_quick_product_default_unit` (`OrdersController.php:205-206`, currently unused).
5. **Confirmations — remove, don't replace with undo.** A post-submit "Undo" of a paid order is a void (`ordersApi.void`) with stock/receipt/drawer implications — exactly the destructive class that deserves a confirm. Drop `isConfirmFullPaymentOpen` and `isSaveAsUnpaidOpen`; keep Void's confirm.

## Capability parity checklist (nothing may be lost)

Every capability stays reachable on always-visible controls. Principle: **defaults, not removals** — only customer & order type were ever *forced*; the plan removes force, not access.

| Capability | Today | New flow | Change |
|---|---|---|---|
| Customer | Forced dialog at Pay | Chip in Quick Context Strip (`totals-summary.tsx:45-62`) → popover search/select; eye = details; ✕ = reset to walk-in/default. No default configured → chip highlighted + old gate at Pay | Same, no longer a roadblock |
| Order type | Forced dialog at Pay | `Takeaway │ Delivery` segmented chip in the strip; Delivery reveals shipping row | Same, no longer a roadblock |
| Shipping | Dialog | Unchanged — shipping row + existing shortcut | None |
| Payment type (cash / bank / customer-account) | Pay → dialog sidebar | **Pay keeps opening the full dialog.** "Exact Cash" is a separate, additional affordance | Additive |
| Change due | Dialog numpad | Unchanged — fast path never fires unless exact total | None |
| Split tender | Dialog, repeated adds | Unchanged — fast path skips when `order.payments` non-empty | None |
| Unpaid order | Pay → 2 forced dialogs → dialog → Unpaid → confirm | Pay → dialog → Unpaid (button at `payment-gateway-dialog.tsx:315`). Confirm dropped, capability stays | Fewer taps |
| Customer-account (credit) payment | Dialog | Unchanged — requires a real customer; fast path is cash-only and can never bypass it | None |
| Hold | Hold button → title dialog | Unchanged + `sb_subul_keyboard_hold_order` shortcut | Additive |
| Discount (cart & per-item) | Keypad dialogs | Unchanged + quick % chips (Phase 6) | Additive |
| Order note | `comments-dialog.tsx` | Unchanged + `note` shortcut | Additive |
| Void | Confirm | Unchanged — confirm kept deliberately | None |

**Known gap:** `sb_subul_keyboard_create_customer` is defined but the POS has no customer-creation UI (`customer-select-dialog.tsx` is search/select/view only). Phase 4 adds a lightweight create form to the customer select popover and wires the shortcut to it.

## Verified findings (audit summary)

| Friction | Location | Notes |
|---|---|---|
| Customer/type gate runs **twice** (cascade + toasts) | `resources/js/hooks/pos/use-pos-checkout.ts:29-39`, `resources/js/components/pos/payment-actions.tsx:41-50, 125-134` | Also duplicates Hold gating |
| No pay fast path | `payment-actions.tsx:36-52` | Finalize orchestration lived inline in `payment-gateway-dialog.tsx:121-211` → extracted in Phase 0 |
| Shortcuts mostly wired already | `resources/js/hooks/use-pos-shortcuts.ts` (7 of 9), `pos-system.tsx:134-144`, `tests/unit/pos-shortcuts.test.ts` | Missing: `hold_order`, `create_customer`, `note`. **Bug:** no editable-field guard — bare-letter shortcuts fire while typing in inputs |
| Scan opens quantity keypad **every scan** | `pos-system.tsx:127-132` | Biggest per-transaction modal in barcode shops |
| Redundant confirms | `payment-gateway-dialog.tsx:44-45, 333-356` | Main Submit Payment already unconfirmed; confirms sit on quick-actions |
| Cart rows already have −/+ steppers | `cart-item.tsx:55-65, 220-268` | Only discount-% chips remain |
| Order-type auto-select (single type) | `pos.tsx:51-61` | Extend to last-used |
| Dormant Default Customer Account | `CustomersSettings.php:44` | Defined, exposed, typed — no frontend consumer |

## Phases

### Phase 0 — Extract the finalization pipeline *(no behavior change)* ✅ done
- [x] `resources/js/services/order-finalize.ts`: `buildReceiptOrder()` (pure) + `submitAndFinalizeOrder()` (submit → toast → option-gated auto-print with retry → cash-drawer kick → reset → onSuccess). Mirrors the historical dialog behavior 1:1; store-free (receives `submitOrder` / `printOrderReceipt`), uses `i18n.translate` (same singleton as `useTranslation`).
- [x] `payment-gateway-dialog.tsx` consumes the service; `PrintAgentService` imports removed from the component.
- [x] Unit tests: `resources/js/tests/unit/order-finalize.test.ts` (receipt enrichment, change math, print gating per payment status, drawer-kick matrix, retry action, error paths).

### Phase 1 — Make customer & order type optional
- [ ] `constants/pos-options.ts` + `types/pos.d.ts`: register `sb_customers_default` consumption (payload already sent).
- [ ] `usePOS` cart init: assign default customer if configured; assign default order type (last-used localStorage → first enabled).
- [ ] `totals-summary.tsx`: convert customer/order-type buttons to popovers; remove `shouldValidate` cascade from `use-pos-checkout.ts` and the duplicate gates in `payment-actions.tsx`.
- [ ] Settings UI copy for walk-in flow; register in `docs/settings-audit.md`.
- [ ] Tests: update `tests/integration/use-pos-checkout.test.ts`; add store auto-assignment test.

### Phase 2 — Exact-cash fast path ✅ done
- [x] Pure `canSubmitExactCash()` + `buildExactCashPayment()` in `services/express-checkout.ts` (6 unit tests).
- [x] "Cash — Exact Amount" button in `payment-actions.tsx`, shown only when cash-ready (items, positive total, no payments/tender); Pay keeps opening the full dialog (split/change/non-cash/unpaid unchanged). Express path shares `submitOrder` + `submitAndFinalizeOrder`.

### Phase 3 — Silent barcode add ✅ done
- [x] `canAddBarcodeSilently()` in `services/pos-defaults.ts` — gated by the existing `sb_subul_show_quantity` setting (which had no runtime consumer; default 'yes' = prompt, preserving current behavior).
- [x] `pos-system.tsx`: scan handler adds qty 1 directly via the extracted `addProductWithUnit()` (stock validation + barcode refocus preserved) when the lookup pre-resolved the unit; keypad remains the fallback.
- [x] `products-categories-panel.tsx`: grid clicks skip the quantity pad the same way (`handleQuantity` gained a unit override to avoid stale state).

### Phase 4 — Complete shortcuts + typing guard
- [ ] `use-pos-shortcuts.ts`: `onHold` (Hold dialog), `onNote` (`comments-dialog.tsx`), `onCreateCustomer` (create form in customer select popover). Editable-target guard before any handler.
- [ ] Extend `tests/unit/pos-shortcuts.test.ts`.

### Phase 5 — Remove redundant confirms ✅ done
- [x] `payment-gateway-dialog.tsx`: delete both `ConfirmationDialog`s; direct-call handlers. Void confirm untouched.
- [x]  hide "Unpaid" button when `sb_orders_allow_unpaid` is 'no' (store already blocks it at `usePOS.ts:390`).

### Phase 6 — Inline discount-% chips *(polish)*
- [ ] `cart-item.tsx`: 5/10/15% chips + keypad fallback; respect `sb_subul_unit_price_ediable` for inline price edit.

### Phase 7 — Search dialog → slide-over *(optional, last)*
- [ ] Reassess after Phase 3 removes most manual-search traffic.

## Conventions & risks

- All new strings through `t()`; new/revived settings registered in `docs/settings-audit.md`; types added to `SbPosOptions`.
- E2E: rewrite `tests/e2e/cashier-checkout.spec.ts` Journey 1 with real assertions (scan → 0 dialogs → POST `payment_status: 'paid'`); add regression test: no default customer configured → old gate still applies.
- Risks: (a) shops wanting forced customer entry keep it by leaving Default Customer Account unset — call out in release notes; (b) fast path must respect register-session stamping — covered because it goes through `submitOrder`; (c) i18n for new labels.


