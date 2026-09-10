# Fix Plan — Adjust Stock & Procurement

Status tracker for the bugs / unimplemented features found in the Adjust Stock and Procurement domains.
Full audit with line numbers: chat transcript of 2026-09-10.

> **Implementation complete 2026-09-10.**
> Verification: `php -l` clean on all 10 backend files · `npm run types` ✓ · `npm run lint` ✓ ·
> `npm run test` 272/272 ✓ · `php artisan event:list` ✓.
> Backend `php artisan test`: the 13 Auth/Settings/Dashboard failures are pre-existing
> (verified by re-running with all changes stashed — same failures on a clean tree).

## A. Critical — data integrity / crashes

- [x] **A1** Adjustment "Reason" never persisted — `ProductService::recordStockHistory()` gained a `$description` parameter; the page's Reason cell opens a working dialog and `adjust_reason` is submitted via `createAdjustment`.
- [x] **A2** `procurement_product_id` ignored by `stockAdjustment()` — resolves `ProcurementProduct` from the id; batch `available_quantity` updates and history rows link to the batch.
- [x] **A3** UI blocked every reduce-action quantity for search-added products — truthy `accurate_tracking` ceiling.
- [x] **A4** `ACTION_SET` equal quantity → undefined `$adjustQuantity` — initialized to 0.
- [x] **A5** `ProcurementController::create()` — plain `to_route('sb.dashboard.procurement-list')`.
- [x] **A6** `deleteProcurementProduct()` — `NotFoundException` when not found.
- [x] **A7** `ProcurementService::edit()` — `general` fields whitelisted (create + edit parity → **B16** done here too).
- [x] **A8** Permission middleware per route in `routes/api/procurements.php`.
- [x] **A9** Wrong `creating` mapping removed from `Procurement::$dispatchesEvents`.

## B. Functional bugs — Procurement

- [x] **B10** Unit-group cache fixed: `storedunitReference`/`storeUnitReference` typos, `$storedBase` → `$storedUnitReference`, inner `extract` writes `itemsToSave`/`storedUnitReference` back into `$data` (single-unit + unit-group + deprecated `updateProcurementProduct` paths).
- [x] **B11** `ProcurementRefreshJob` route name → `sb.dashboard.procurement-invoice`.
- [x] **B12** `editProduct` — "stocked" guard added.
- [x] **B13** `changePaymentStatus` — `payment_status` validated (`in:paid,unpaid`).
- [x] **B14** `ProcurementRequest::authorize()` — `subul.create.procurements` on POST, `subul.update.procurements` otherwise.
- [x] **B15** `ProcurementRequest::rules()` — status enums, provider/product `exists`, per-product `unit_id`/`quantity`/prices validation.
- [x] **B16** `edit()` name fallback `?: $this->procurementName()`.
- [x] **B17** `deleteProduct()` `sucecss` → `success`.
- [x] **B18** `TransactionService::hadTransactionHistory()` — `isNotEmpty()` (was always false).
- [ ] **B19** `setQuantity` price-less stock rows — deliberately deferred.

## C. Frontend bugs — Adjust Stock

- [x] **C20** Immutable state updates everywhere (`handleQuantity` maps via `setProducts`; pure `recalculateProduct`).
- [x] **C21** Null-safe `adjust_unit` (`N/A` + first-unit fallback on add; null blocks submit).
- [x] **C22** Unit dialog compares `adjust_unit?.id === unit.id` (UnitQuantity ids on both sides).
- [x] **C23** Row identity via `` `${product.id}-${product.adjust_unit?.unit?.id}` `` keys + both-branch dedupe guards.

## D. Surrounding pieces

- [x] **D24** `routes/api/products.php` adjustments middleware → `subul.make.products-adjustments`.
- [x] **D25** `stockAdjustment()` — `$unit` resolved before use.

## E. Unimplemented features

- [x] **E29** Scheduler: `StockProcurementJob` every 30 min + `DetectLowStockProductsJob` daily in `bootstrap/app.php` (broader list tracked as issue #11).
- [x] **E30** Batch data plumbing (via A2): adjustments update/link the batch. Interactive batch *selector* dialog remains a follow-up.
- [x] **E31** Tax computation end-to-end: controllers pass `TaxGroup::with('taxes:id,tax_group_id,rate')`; tax modal stores group + summed rate atomically; `services/procurement.ts` computes `getVatValue(price, rate, type) * qty` per `tax_type`.
- [x] **E32** `validateForm()` — real client validation (name, provider, ≥1 product, per-row unit).
- [x] **E33** Default dates = today.
- [x] **E34** `formatCurrency` in products table.
- [x] **E35** Selected-unit label (resolves `unit_id` against `unit_quantities`).
- [x] **E36** Dedupe when adding to a procurement + unique `_key` row identity.
- [x] **E37** `procurementsApi.changePaymentStatus(id, paymentStatus)`.
- [x] **E38** 'Draft' delivery status option in the general tab.

## Additional fixes shipped

- **Lost-update race** — `updateProduct` uses functional `setData` + patch objects; modals apply single atomic patches.
- **Row identity** — unique `_key` per procurement row (React key, update/remove/modal targeting).
- **Edit duplicates** — payload includes the procurement-product `id` for existing rows; new rows omit `id`.
- **Numeric payload safety** — `buildProcurementPayload` coerces numeric fields through `Number(...)`.
- **A2 batch plumbing** — adjustments resolve `ProcurementProduct` from `procurement_product_id`.

## Verification loop

1. [x] `npm run types && npm run lint && npm run test` — ✓ (272/272)
2. [x] `php artisan test` — ✓ (13 pre-existing Auth/Settings/Dashboard failures; identical with changes stashed)
3. [x] `php artisan event:list` — ✓
4. [ ] `npm run translation:check` — run before commit (E38 reuses existing keys).

## Deferred (follow-ups)

- **B19** price-less `ProductUnitQuantity` rows created by procurement stocking.
- **E30** interactive procurement batch selector dialog (backend plumbing done).
- Pre-existing `tests/Feature/Auth|Settings|Dashboard` failures (outside these domains).
