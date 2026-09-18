# Backend-Driven Tables — 06: Phase 6 Cleanup & Verification

*Directory: `docs/plans/backend-driven-tables/`*
*Sequence: Step 6 of 7*

---

## Objective

Remove the dead per-page list code, update the architecture docs, run the full verification loop, and close out the audit with post-migration results.

---

## Micro-Step T6.1: Dead code removal

- **Files**: `resources/js/pages/dashboard/**` (any list-page files not already deleted during Phases 3–5), `resources/js/api/*.ts`.
- **Implementation Instructions**:
  1. Verify no per-page list code remains: since Phase 3, migrated `page.tsx` files are deleted wholesale (the generic `crud/list` page renders instead). Sweep for stragglers: hand `ColumnDef` arrays, `DropdownMenu` blocks, per-page `deleteDialog` state + `ConfirmationDialog` usage, hardcoded `bulkActions`, `filterableColumns`, `handleAddNew`/`handleRefresh` — only on pages migrated in Phases 3–5.
  2. Delete `entityApi` list/delete methods **only after** confirming zero consumers (search `resources/js/` — POS components share these modules; keep anything POS or checkout touches).
  3. Remove now-unused imports/types; run `npm run types && npm run lint` (zero warnings required).
- **Commit**: `refactor(tables): remove superseded hand-written list page code`

---

## Micro-Step T6.2: Architecture docs update

- **Files**: `[MODIFY]` `docs/agents/architecture.md`.
- **Implementation Instructions**:
  1. **Layer map**: add `components/tables/crud-table/` row — "Render + user intent; columns/actions/config come from `GET /api/crud/{ns}/config` + `CrudEntry::$actions`; computation/state in `use-crud-table`/`use-action-executor`." Add the `CrudService::table()` → `pages/crud/list.tsx` rendering spine: controllers render lists via `table()`; there is one generic list page, no per-page React shells.
  2. **Ripple map**: "You change a CRUD's `getColumns()`/`setActions()` → check the table contract tests (`CrudTableConfigContractTest`, `CrudEntryActionsContractTest`) and the affected page."
  3. **Known debt**: record the products bespoke exception (tables, B3.b-analog), the popup-registry fallback policy, and any Phase 5 deferrals.
  4. Payload contract: document the server query params (`page`, `per_page`, `search`, `active`+`direction`, `queryFilters` URL-encoded JSON) and the JSON-only toast rule for GET/DELETE actions.
- **Commit**: `docs(architecture): document backend-driven tables layer and contracts`

---

## Micro-Step T6.3: Full verification loop

- **Instructions**:
  1. `npm run types && npm run lint && npm run test` (all green, zero warnings).
  2. `php artisan test` (Pest; contract tests included). Compare against the pre-existing baseline failures noted in `docs/backend-driven-forms-audit.md` — fix nothing unrelated.
  3. `npm run test:e2e` — add Playwright smoke for one Wave-1 page (list, sort, search, delete-with-confirm) and the orders page (popup action, row colors, pagination) if cheap; otherwise record manual smoke evidence.
  4. `npm run translation:check` — any new UI strings ("Copy ID" exists; "Confirm Your Action" exists; check executor fallback strings).
  5. `npm run format`.
- **Commit**: `test(tables): full verification pass for backend-driven tables`

---

## Micro-Step T6.4: Audit close-out

- **Files**: `[MODIFY]` `docs/backend-driven-tables-audit.md`.
- **Implementation Instructions**:
  1. Add a "Post-migration status" section: per-bug status (#1–#9), per-page migration table (page → namespace → wave → status), missing-actions table (now exposed), popup registry coverage.
  2. List any deferred item with its reason (e.g. products bespoke, deferrals from T4.10).
  3. Cross-link from `docs/agents/architecture.md` and this plan series.
- **Commit**: `docs(tables): close out backend-driven tables audit with results`
- **Exit Criteria (project complete)**: every dashboard list page either backend-driven or recorded as a sanctioned exception; all 9 audit bugs resolved; contract + vitest suites guard the engine; docs updated.
