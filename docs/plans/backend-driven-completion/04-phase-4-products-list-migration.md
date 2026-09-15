# Backend-Driven Completion — Phase 4: Products List Migration (`ProductCrud::table()`)

*Directory: `docs/plans/backend-driven-completion/`*
*Sequence: Step 4 of 9 — independent of Phases 1–3*

---

## Objective

Retire the last hand-built list page (`dashboard/products/page.tsx`) by flipping `ProductsController::listProducts` to the already-prepared `ProductCrud::table()` (commented at `ProductsController.php:347`), and reconcile the two action-label/url mismatches found in `ProductCrud::setActions` (`ProductCrud.php:750-762`) with the hand page's actual semantics.

This **un-sanctions** the B3.b-analog exception recorded in `docs/plans/backend-driven-leftovers/00` (tables Track D). Rationale: the original blocker ("hand-built rows carry no `$actions`, so the executor cannot render without forcing the crud-list round-trip") is circular once the page itself moves to the shell — rows then come from `GET /api/crud/sb.products` carrying `$actions`.

## Micro-Step P4.1 — Pre-flight parity audit of the hand page

- **Files**: read-only sweep of `resources/js/pages/dashboard/products/page.tsx`
- **Implementation**: enumerate what the hand page does that the config must now carry:
  1. Columns actually rendered (name, type, sku, category, status, author, date …) vs `ProductCrud::getColumns` (:682-724).
  2. Author/category hydration — the controller hand-writes `addSelect(['author_name' => …, 'category_name' => …])` (:330-341); verify `ProductCrud::$relations` hydrates the same aliases (`user_username`, `category_name`) as the columns expect; add relations if missing (pattern: `ProcurementCrud.php:46-49`).
  3. Bulk delete wiring (hand) vs `getBulkActions` (backend, exists).
  4. The old Blade quantity popup: `Hook::addAction('sb-crud-footer', …)` + `pages.dashboard.products.quantity-popup` view (:330-334) — dead in the SPA (the shell never rendered the footer); confirm and delete with the hand render.
  5. The hand page's Preview/Quantities/History semantics vs `setActions` mislabels (`sb.quantities` POPUP "Preview" → **edit** URL :750-755; `units` GOTO "See Quantities" → `/products/{id}/units` :757-762).
- **Output**: a short checklist appended to this file before implementation (fill the table in P4.3).

## Micro-Step P4.2 — Fix `setActions` labels/targets + popup strategy

- **Files**: `[MODIFY]` `app/Crud/ProductCrud.php`
- **Implementation**:
  1. Rename for truthfulness: `sb.quantities` POPUP labeled "Preview" opens the edit URL — either (a) relabel to "Edit Preview"… no: the hand page's "Preview" opened the quantities popup (Blade). Decide by evidence in P4.1; default plan: make `sb.quantities` a **GOTO** to `/dashboard/products/{id}/units` labeled "See Quantities", and drop the duplicate `units` action — OR keep POPUP and register it (2b below). Choose one, delete the other action; no dead identifiers.
  2. If any POPUP identifier survives: register it in `resources/js/components/tables/crud-table/action-popup-registry.tsx` (precedent: `sb.orders::sb.order-refunds` conditional iframe). Otherwise the dev-time warning + navigate fallback triggers on every row (unacceptable for a primary list).
  3. Keep `edit` GOTO, `history` GOTO, `delete` DELETE (already correct).
- **Test & Analyze**: `php artisan test --filter=ProductCrud` green; manual row action smoke on the migrated list.
- **Commit**: `fix(crud): reconcile product row actions (labels, targets, popup registration)`

## Micro-Step P4.3 — Flip the controller + delete the page

- **Files**: `[MODIFY]` `app/Http/Controllers/Dashboard/ProductsController.php`; `[DELETE]` `resources/js/pages/dashboard/products/page.tsx` (+ any component only it imported)
- **Implementation**:
  1. `listProducts` (:325-348) becomes: `sb()->restrict(['subul.read.products']);` + `return ProductCrud::table();` (delete the hand query, the `sb-crud-footer` hook, the commented line, and the Inertia render).
  2. Delete `page.tsx` after grepping its unique imports (POS/other pages must not import from it).
  3. `table()` enforces `allowedTo('read')` internally (same as the procurements flip).
- **Test & Analyze**:
  - `php artisan test` green.
  - Manual: `/dashboard/products` — columns/sort/filter parity, row actions fire, bulk delete works, pagination replaces the unbounded hand load (this fixes an N+products memory issue), POS grid unaffected (separate surface).
- **Commit**: `refactor(products): backend-driven products list (ProductCrud::table())`

## Micro-Step P4.4 — Docs

- **Files**: `[MODIFY]` `docs/agents/architecture.md` (known-debt #7/#8 — remove the products-list exception; note the POS/bespoke remainder), `docs/backend-driven-tables-audit.md` (addendum), `docs/plans/backend-driven-leftovers/00-overview-and-verification.md` (strike the B3.b-analog sentence — history preserved by git).
- **Commit**: `docs: products list migration record`

---

## Parity table (fill during P4.1, before implementing)

| Hand page behavior | Config carrier | Status |
|---|---|---|
| *(fill in during pre-flight)* | | |

## Risks / rollback

- The hand page may carry column formatting (badges, links) the generic renderer must express via `$direction`/raw types — if a gap appears, extend `getColumns` with the same mechanisms orders/procurements used (`$cssClass`, raw values in `setActions`), not bespoke client code.
- Rollback: revert the controller flip; the hand page deletion must be in the same commit as the flip so rollback is atomic.
