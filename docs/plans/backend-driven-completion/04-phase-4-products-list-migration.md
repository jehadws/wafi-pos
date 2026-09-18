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

## Parity table (filled during P4.1 — pre-flight audit evidence)

| Hand page behavior | Config carrier | Status |
|---|---|---|
| Columns: select, name, type, sku, category_name, status, author_name, created_at, actions (`page.tsx:62-146`) | `getColumns` :682-724 (name, type, sku, category_name, status, `user_username`, created_at) + checkbox/actions columns via `showCheckboxes` / `prependOptions` | ✅ Parity — backend superset: `type` cast-labeled (`ProductTypeCast`), `status` → Available/Hidden, `category_name` → "Unassigned" fallback, `created_at` date-formatted by the `*_at` convention, nulls → em dash |
| Author/category hydration — hand `addSelect(['author_name' => …, 'category_name' => …])` (`ProductsController.php:338-341`) | `ProductCrud::$relations` :63-69 joins `user` / `category` + `$pick` :72-76 → `user_username` / `category_name` | ✅ Already hydrated — aliases match the columns exactly; **no relations added** (the `ProcurementCrud.php:46-49` pattern was already applied here) |
| Search `searchKey="name"` — client-side over the unbounded prop | server-side `search` param on `GET /api/crud/sb.products` | ✅ Improved (server-side + paginated; fixes the N-products memory load) |
| Sortable headers (TanStack client-side sort on every column) | `$sort => false` on all columns; backend `hook()` orders `updated_at desc` | ⚠️ Accepted difference — backend is the single source of truth; consistent with the 27 already-migrated pages |
| Row actions: Copy ID (`page.tsx:129`), Edit → `/dashboard/products/edit/{id}`, Delete w/ own dialog | shell built-in Copy ID (`row-actions-menu` copies `row.$id`); `edit` GOTO :743-748; `delete` DELETE + standardized confirm :771-780 | ✅ Parity + gains (See Quantities / See History GOTOs); delete moves to the standardized confirm |
| `sb.quantities` POPUP labeled "Preview" → **edit** URL (:750-755) + duplicate `units` GOTO "See Quantities" (:757-762) | **P4.2 resolution:** `sb.quantities` becomes **GOTO** → `/dashboard/products/{id}/units` labeled "See Quantities"; the duplicate `units` action is **deleted**; no POPUP survives → no registry entry needed | 🔧 Fixed in P4.2 |
| Bulk "Delete Selected" → `productsApi.bulkDelete` (`page.tsx:148-164`) | `getBulkActions` :848-860 `delete_selected` → same `sb.api.crud-bulk-actions` endpoint | ✅ Parity; note the "Delete Selected Groups" label is the fleet-wide copy-paste present on every CRUD — recorded, deliberately not changed here (a cross-cutting label sweep is not this phase) |
| Add New → `route('sb.dashboard.products.create')`; Refresh; title "Products List" / "Display all products." | `getLinks` :834-841 + `getLabels` :136-153 (same strings) | ✅ Parity; Add New keeps targeting the bespoke products form (Phase 5) |
| Blade quantity popup: `Hook::addAction('sb-crud-footer', …)` + `pages.dashboard.products.quantity-popup` view (`ProductsController.php:331-335`) | — (the SPA shell never rendered `sb-crud-footer`) | 🗑️ Dead — **the view file does not exist on disk** (verified `Test-Path`); hook deleted with the hand render |

### P4.1 checklist (conclusions before implementation)

1. No `ProductCrud` relations work required (`user_username` / `category_name` already hydrate).
2. P4.2: `sb.quantities` → GOTO (units URL, "See Quantities" label); delete the `units` action; no POPUP identifier survives → **no** `action-popup-registry` registration; the stale registry comment + registry test comment (`sb.products::sb.quantities` fallback note) must be updated instead.
3. `edit` GOTO, `history` GOTO, `delete` DELETE stay as-is.
4. Delete the dead `sb-crud-footer` hook with the hand render (referenced view already absent).
5. After the flip, `productsApi.remove` / `productsApi.bulkDelete` (`api/products.ts:30-35`) become dead — their own doc comment says they "serve the bespoke products list page". Delete both methods + fix the file comment (same spirit as the Phase-9 dead-API-helpers sweep).
6. `Output` and `User` imports in `ProductsController` become unused with the flip — remove them (verified: no other usage/type-hints).

## Risks / rollback

- The hand page may carry column formatting (badges, links) the generic renderer must express via `$direction`/raw types — if a gap appears, extend `getColumns` with the same mechanisms orders/procurements used (`$cssClass`, raw values in `setActions`), not bespoke client code.
- Rollback: revert the controller flip; the hand page deletion must be in the same commit as the flip so rollback is atomic.
