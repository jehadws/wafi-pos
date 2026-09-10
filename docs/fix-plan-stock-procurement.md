# Fix Plan — Adjust Stock & Procurement

Status tracker for the bugs / unimplemented features found in the Adjust Stock and Procurement domains.
Findings doc: see chat transcript of 2026-09-10 (full audit with line numbers).

## A. Critical — data integrity / crashes

- [ ] **A1** Adjustment "Reason" never persisted
  - `app/Services/ProductService.php` — `recordStockHistory()`: `$description` not a parameter → always `''`. Add `$description` param, persist it.
  - `resources/js/pages/dashboard/products/stock-adjustment/page.tsx` — re-enable the Reason cell + add a reason dialog that sets `adjust_reason`.
- [ ] **A2** `procurement_product_id` ignored by `stockAdjustment()`
  - `ProductService::stockAdjustment()` — resolve `$procurementProduct` from `$procurement_product_id` when the object isn't provided, so UI adjustments update the batch `available_quantity` and link history rows.
- [ ] **A3** Stock-adjustment UI blocks every reduce-action quantity for search-added products
  - `page.tsx:54` — `product.accurate_tracking !== undefined` must be a truthy check (`if (product.accurate_tracking && …)`).
- [ ] **A4** `ACTION_SET` with equal quantity → undefined `$adjustQuantity`
  - `ProductService.php` SET branch — initialize `$adjustQuantity = 0` before the branch.
- [ ] **A5** `ProcurementController::create()` — `to_route(name, $result)` passes an array as the HTTP status → TypeError after commit. Use a plain redirect.
- [ ] **A6** `deleteProcurementProduct()` — null `ProcurementProduct::find()` → fatal. Throw `NotFoundException`.
- [ ] **A7** `ProcurementService::edit()` — whitelist the `general` fields (mass-assignment).
- [ ] **A8** Procurement mutation endpoints lack permission middleware — add `SbRestrictMiddleware` per-route in `routes/api/procurements.php` (create/update/delete namespaces).
- [ ] **A9** `Procurement::$dispatchesEvents` maps `creating` → `ProcurementAfterCreateEvent` — remove the wrong mapping (custom Before/After events are dispatched manually by the service).

## B. Functional bugs — Procurement

- [ ] **B10** Unit-group cache broken: `storedunitReference` typo (line ~386), `storeUnitReference` typo (line ~702), and `__procureForUnitGroup` writes to `$storedBase` but returns `$storedUnitReference`. Fix all three so the cache round-trips.
- [ ] **B11** `ProcurementRefreshJob` uses non-existent route name `sb.procurement-invoice` → `sb.dashboard.procurement-invoice`.
- [ ] **B12** `editProduct` (PUT `procurements/{id}/products/{product_id}`) missing "stocked" guard — add it.
- [ ] **B13** `changePaymentStatus` — validate `payment_status` (in: paid, unpaid).
- [ ] **B14** `ProcurementRequest::authorize()` — create vs update permission by HTTP method.
- [ ] **B15** `ProcurementRequest::rules()` — validate `products` (product_id exists, unit_id, quantity numeric ≥ 0) and status enums.
- [ ] **B16** `edit()` name fallback `?: $this->procurementName()` (parity with create()).
- [ ] **B17** `deleteProduct()` return typo `sucecss` → `success`.
- [ ] **B18** `TransactionService::hadTransactionHistory()` — Collection `instanceof` check always false → `isNotEmpty()`.
- [ ] **B19** `setQuantity` price-less stock rows — out of scope for this pass (documented risk).

## C. Frontend bugs — Adjust Stock

- [ ] **C20** Immutable state updates in `handleQuantity` / unit / action selection handlers (no in-place mutation without `setProducts`).
- [ ] **C21** Null-safe `adjust_unit` rendering (remove `!` non-null assertions at ~323/361).
- [ ] **C22** Fix "selected" unit comparison (PUQ id vs Unit id).
- [ ] **C23** Unique row keys for cross-branch duplicates (`_key` per row).

## D. Surrounding pieces

- [ ] **D24** `routes/api/products.php` adjustments middleware `subul.update.products` → `subul.make.products-adjustments` (match controller + menu).
- [ ] **D25** `stockAdjustment()` undefined `$unit` fallback (line ~1190) — resolve `$unit` before use.

## E. Unimplemented features

- [ ] **E29** Scheduler: register `StockProcurementJob` (+ `DetectLowStockProductsJob`) in `bootstrap/app.php` `withSchedule` (ref. issue #11 for the broader list).
- [ ] **E30** Procurement batch selector in stock-adjustment UI — load batches for accurate-tracking products, allow selecting one, update `available_quantity`/`procurement_product_id` (depends on A2).
- [x] **E31** Procurement tax computation — compute `tax_value` from the tax group rate (inclusive/exclusive) instead of storing the group name; recompute on price change. (`ProcurementController` now eager-loads `taxes:id,tax_group_id,rate`; `calculateLineItemPrices` reuses cart-engine tax primitives.)
- [x] **E32** `validateForm()` — real client validation (name, provider, ≥1 product, per-product unit + quantity > 0, `$invalid` row flags).
- [x] **E33** Default dates = today (drop hardcoded `2025-06-14`).
- [x] **E34** `formatCurrency` in products table (drop hardcoded `USD`).
- [x] **E35** Selected-unit label in products table (resolves `unit_id` against `unit_quantities`).
- [x] **E36** Dedupe when adding a product to a procurement (toast warning).
- [ ] **E37** `procurementsApi.changePaymentStatus` client method.
- [ ] **E38** 'Draft' delivery status option in general tab.

## Additional fixes shipped with E31–E36

- **Lost-update race** — `updateProduct` now uses functional `setData` and accepts patch objects; Tax/Convert modals apply single atomic patches instead of two consecutive calls.
- **Row identity** — every product row gets a unique `_key` (React key, update/remove/modal targeting). Fixes wrong-row edits and duplicate-key crashes from `product_id` collisions.
- **Edit duplicates** — payload now includes the procurement-product `id` (backend `saveProducts` matches by it), and newly added rows omit `id` so the backend can't `ProcurementProduct::find()` an unrelated row.
- **Numeric payload safety** — `buildProcurementPayload` coerces all numeric fields through `Number(...)` (previously `!Number.isNaN(product.x)` passed non-numeric strings through).

## Verification loop

1. `npm run types && npm run lint && npm run test`
2. `php artisan test`
3. `php artisan event:list` sanity check
4. `npm run translation:check` for new UI strings
