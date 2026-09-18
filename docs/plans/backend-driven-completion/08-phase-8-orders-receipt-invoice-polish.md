# Backend-Driven Completion — Phase 8: Orders Receipt/Invoice Polish (typing + prop hygiene)

*Directory: `docs/plans/backend-driven-completion/`*
*Sequence: Step 8 of 9 — independent; scope is polish only, the pages stay bespoke by design (print target pages)*

---

## Objective

The orders receipt and invoice pages are Inertia **target** pages (rendered by `OrdersController::orderReceipt:313` / `::orderInvoice:278`), not CRUD surfaces — they will never be `crud/*` shells. What's actually broken about them: `any`-typed props and two **service objects passed as Inertia props**. Fix those; change no markup.

## Findings (verified)

1. `orderReceipt` (:313-321) passes `'optionsService' => $this->optionsService` and `'ordersService' => $this->ordersService` — **service instances** as props. Inertia serializes only public properties; the page (`receipt/page.tsx:8-18`) then reads `optionsService?.sb_invoice_receipt_logo` — working by accident, fragile by construction.
2. Both pages take `any` props (`receipt/page.tsx:8`, `invoice/page.tsx:14-20`) and `payment`/`product` row `any`s inside maps.
3. The invoice page renders `title` via `dangerouslySetInnerHTML` (`invoice/page.tsx:50`) because the controller embeds `&mdash;` (`:283`).

## Micro-Step P8.1 — Plain-data props

- **Files**: `[MODIFY]` `app/Http/Controllers/Dashboard/OrdersController.php`
- **Implementation**:
  1. `orderReceipt`: replace `'optionsService' => $this->optionsService` with the plain values the page actually reads — `'options' => $this->optionsService->get()` (the invoice page already does this at :280) — and delete `'ordersService'` if the page doesn't use it (verify; it appears unused by `receipt/page.tsx`).
  2. `paymentTypes` map stays (:318-320).
- **Commit**: `fix(orders): pass plain options to receipt page (no service props)`

## Micro-Step P8.2 — Types

- **Files**: `[MODIFY]` `resources/js/pages/dashboard/orders/receipt/page.tsx`, `invoice/page.tsx`, (if needed) `resources/js/types/models/…`
- **Implementation**:
  1. Type the `order` prop from the existing order model type (the same one POS/orders use — locate in `resources/js/types/models/`); type rows (`payments`, `products`) off it.
  2. `options: Record<string, string>`; `paymentTypes: Record<string, string>`; invoice `billing`/`shipping` props are `FormFieldDef[]` (they come from `CustomerCrud::getForm()['tabs']['billing']['fields']`, `OrdersController:281-282`).
  3. Title: either keep `dangerouslySetInnerHTML` with a comment (controller-controlled string, safe) or pass a plain `title` without the entity and let the page compose with `–`. Choose the latter if trivial.
- **Test & Analyze**: `npm run types && npm run lint && npm run test`; manual print previews of receipt + invoice unchanged.
- **Commit**: `refactor(orders): type receipt/invoice page props`

---

## Risks / rollback

- Purely mechanical; the only behavior risk is the `options` shape switch on the receipt page — the page reads `sb_invoice_receipt_logo` / `sb_invoice_receipt_footer` (receipt/page.tsx:12-13), so the plain `options` array supplies identical keys.
- Rollback trivial (revert).
