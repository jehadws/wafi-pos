# Backend-Driven Completion — Phase 3: Procurement Controller Sweep + Hand-File Deletions

*Directory: `docs/plans/backend-driven-completion/`*
*Sequence: Step 3 of 9 — depends on Phases 1–2*

---

## Objective

Point the procurement create/edit renders at the generic form shell and delete the six hand files. After this phase, procurements are fully backend-driven (list was already done in T4.1).

## Micro-Step P3.1 — Controller sweep

- **Files**: `[MODIFY]` `app/Http/Controllers/Dashboard/ProcurementController.php`
- **Implementation**:
  1. `createProcurement` (:281-303): replace the Inertia hand render (and the `$tax_groups`/`$providers` queries — the form config now carries both) with `return ProcurementCrud::form();` (keeps the `sb()->restrict(['subul.create.procurements'])` guard — `form()` re-checks via `getFormConfig`, harmless).
  2. `updateProcurement` (:305-330): replace with `return ProcurementCrud::form($procurement);` — `getFormConfig(entry)` enforces `subul.update.procurements`. The stocked-edit guard now lives in `beforePut` (Phase 1) and in `ProcurementService::edit`.
  3. Delete the commented-out legacy Blade code block (:296+ `// return View::make(…)`).
  4. Leave `procurementInvoice`, `editProcurementProduct` (`procurements/products/edit.tsx` — L8.3 deferral stands), `listProcurements`, and every API method untouched.
- **Test & Analyze**:
  - `php artisan test --filter=ProcurementCrud` suites green.
  - Manual: `/dashboard/procurements/create` renders the `crud/form` shell with main name + general tab + products section; `/dashboard/procurements/edit/{id}` seeds rows; submit → toast + redirect to the procurements list; cancel → history back.
- **Commit**: `refactor(procurements): render forms via ProcurementCrud::form()`

## Micro-Step P3.2 — Delete hand files

- **Files**: `[DELETE]` `resources/js/pages/dashboard/procurements/create.tsx`, `edit.tsx`, `use-procurement-form.ts`, `procurement-general-tab.tsx`, `procurement-products-tab.tsx` (after its P2.2 move), `procurement-item-modals.tsx` (after its P2.2 move)
- **Implementation**:
  1. Grep for stragglers before deleting: `search_codebase` for `use-procurement-form|procurement-general-tab|procurement-item-modals|ProcurementProductsTab` — the only consumers must be the files being deleted plus the P2.2 moved copies.
  2. `buildProcurementPayload` in `resources/js/services/procurement.ts` becomes dead with the hook (the shell's `buildCrudPayload` emits the same shape natively) — delete it **only if** `ProcurementItemModals`/the moved field don't import it; the POS-side consumers of `services/procurement.ts` stay untouched.
  3. Keep `procurements/products/edit.tsx` and `services/procurement.ts` exports used by POS.
- **Test & Analyze**: `npm run types && npm run lint && npm run test` — zero errors (the moved components are the only remaining importers).
- **Commit**: `chore(cleanup): delete hand procurement form files (backend-driven form live)`

## Micro-Step P3.3 — Parity checklist (manual, record in PR description)

| Behavior | Before (hand page) | After (shell) |
|---|---|---|
| Fields | name + general tab (provider, delivery/payment status, invoice date/reference, delivery time, approval) + products rows | same, from `getForm` |
| Provider inline-create | `sbCrudForm` modal | same (`search-select` component) |
| Products rows | search/add/dedupe, unit, tax, options, convert modals | same components, registry-driven |
| Validation | client toasts + 422 `general.*` mapped to `general_*` state keys | client rules + 422 dot keys straight into `ConfigForm` |
| Submit | `POST/PUT /api/procurements[/id]` | `POST/PUT /api/crud/sb.procurements[/id]` → `beforePost/beforePut` → `ProcurementService` |
| Stocked edit | 500/exception page | 422 on `general.delivery_status` (improvement, noted) |
| Redirect | stays (toast) | `redirect` → `/dashboard/procurements` |

## Risks / rollback

- If any parity gap appears, the hand pages are one `git revert` away (Phase 3 commits are independent of Phase 1/2).
- The invoice GOTO action from the procurements table (`ProcurementCrud::setActions:420-425`) targets `/dashboard/procurements/edit/{id}/invoice` — unaffected.
