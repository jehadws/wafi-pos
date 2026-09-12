# Backend-Driven Tables — 02: Phase 2 Table Engine Primitives

*Directory: `docs/plans/backend-driven-tables/`*
*Sequence: Step 2 of 7*

---

## Objective

Build the generic, backend-driven table engine under `resources/js/components/tables/crud-table/` — the tables counterpart of `components/forms/config-form/`. After this phase, migrating a list page is a thin Inertia shell plus a controller prop, with zero hardcoded columns/actions.

**Existing building blocks to reuse (do not rebuild):**
- `resources/js/components/ui/data-table/data-table.tsx` — already supports custom (server) pagination, server-side search, `filterableColumns`, `bulkActions`, `onAddNew`, `onRefresh`, `isLoading`.
- `resources/js/api/crud.ts` — `list()` already exists; add `tableConfig()`.
- `components/feedback/confirmation-dialog` — reuse as the single confirm dialog.
- `@/lib/i18n` `useTranslation` — all new UI strings through it; run `npm run translation:check` after.

---

## Micro-Step T2.1: Types & API client

- **Files**:
  - `[NEW]` `resources/js/types/tables.ts`
  - `[MODIFY]` `resources/js/api/crud.ts`
- **Implementation Instructions**:
  1. `types/tables.ts` (document the PHP sources in the header comment, mirroring `types/forms.ts`):
     - `CrudRowAction { label: string; identifier: string; url: string; confirm?: { message: string; title?: string }; type: 'GOTO' | 'DELETE' | 'GET' | 'POPUP'; permissions: string[] }`
     - `CrudColumnDef { label: string; '$direction'?: string; '$sort'?: boolean; width?: string }` (index signature for future keys)
     - `CrudQueryFilter` (name, label, type — mirrors `queryFilters` definitions incl. `daterangepicker`)
     - `CrudBulkAction { label: string; identifier: string; url?: string }`
     - `CrudTableConfig { columns: Record<string, CrudColumnDef>; queryFilters: CrudQueryFilter[]; labels: Record<string, string>; links: Array<{ type: 'link'; href: string; label: string }>; bulkActions: CrudBulkAction[]; prependOptions: boolean; showOptions: boolean; showCheckboxes: boolean; headerButtons: unknown[]; namespace: string }`
     - `CrudEntryRow = Record<string, unknown> & { '$id'?: number | string; '$cssClass'?: string; '$actions'?: Record<string, CrudRowAction> }` — `__raw` is ignored by renderers.
  2. `api/crud.ts`: add `tableConfig: <T = CrudTableConfig>(table: string) => get<T>(`/crud/${table}/config`)`.
- **Test & Analyze**: `npm run types && npm run lint`
- **Commit**: `feat(tables): add CrudTableConfig types and crudApi.tableConfig`

---

## Micro-Step T2.2: `use-crud-table` hook

- **Files**: `[NEW]` `resources/js/components/tables/crud-table/use-crud-table.ts`
- **Implementation Instructions**:
  1. Props: `{ namespace: string; initialConfig?: CrudTableConfig; initialQuery?: Record<string, string> }`.
  2. State: `config`, `entries` (paginator shape), `loading`, `error`, `query` = `{ page, perPage, search, sortKey, direction, queryFilters }`.
  3. Fetch config once (`crudApi.tableConfig`) unless `initialConfig` passed; fetch entries on every query change via `crudApi.list(namespace, { page, per_page, search, active: sortKey, direction, queryFilters })` — `active`/`direction` only sent together; `queryFilters` sent as URL-encoded JSON (backend contract, `CrudService.php:815-858`).
  4. Expose `{ config, entries, rows, loading, error, refresh(), setPage, setPerPage, setSearch, setSort, setQueryFilters }` with debounced search (reuse an existing debounce hook if present).
  5. Sorting guard: column with `$sort === false` never sends `active`/`direction`.
- **Test & Analyze**: `npm run test -- use-crud-table` (new vitest with mocked `crudApi`; assert query-param composition, refresh, error state).
- **Commit**: `feat(tables): add use-crud-table hook for backend-driven table state`

---

## Micro-Step T2.3: Columns builder

- **Files**: `[NEW]` `resources/js/components/tables/crud-table/columns-builder.ts`
- **Implementation Instructions**:
  1. Build tanstack `ColumnDef<CrudEntryRow>[]` from `config.columns` (preserve backend key order): `header` = translated label, `size`/width from `width`.
  2. Server-side sorting: `enableSorting: column.$sort !== false`; the table calls `setSort(key, direction)` — never local sort models for server pages.
  3. Cell rendering: default = raw value as string (backend pre-formats most cells in `setActions`); convention renderer for date-ish keys (`created_at`, `updated_at`, `*_at`) via `formatDateTime` when the value parses as a date; null/empty → `—` (or backend-provided "N/A" which is already common).
  4. Prepend/append the actions column per `config.prependOptions` / `config.showOptions`; prepend the checkbox column per `config.showCheckboxes`.
  5. Row-level `$cssClass` is applied by the table shell (T2.8), not here.
- **Test & Analyze**: vitest for order, sorting flags, date convention, empty-value rendering.
- **Commit**: `feat(tables): add columns-builder translating backend column defs to tanstack`

---

## Micro-Step T2.4: Row actions menu

- **Files**: `[NEW]` `resources/js/components/tables/crud-table/row-actions-menu.tsx`
- **Implementation Instructions**:
  1. Render `DropdownMenu` items strictly from `row.$actions` (order = backend insertion order).
  2. Destructive styling (`text-destructive`) when `type === 'DELETE'`.
  3. Separator + exactly one built-in **Copy ID** item at the end (decision log) — copies `row.$id ?? row.id`.
  4. Item click delegates to the action executor (T2.5); disabled state while an action is in-flight.
  5. No permission logic client-side; the backend already filtered the list.
- **Test & Analyze**: vitest — renders only provided actions, one Copy ID, DELETE styling.
- **Commit**: `feat(tables): add generic row actions menu driven by entry actions`

---

## Micro-Step T2.5: Action executor

- **Files**: `[NEW]` `resources/js/components/tables/crud-table/use-action-executor.ts`
- **Implementation Instructions**:
  1. Single orchestrator `runAction(row, action)`:
     - **GOTO** → normalize the absolute backend URL to a path (`new URL(url)`) and `router.visit(path)`. Print/direct-HTML targets (orders invoice/receipt, if confirmed in T1.7) open via `window.open` instead.
     - **GET** → if `confirm` present, open the shared `ConfirmationDialog` first → axios `get(url)` → toast only if the response is JSON with `message` (some endpoints return `redirect()->back()` HTML) → `refresh()`.
     - **DELETE** → confirm dialog (`title: action.confirm?.title ?? t('Confirm Your Action')`, `message: action.confirm?.message`, destructive variant) → `del(action.url)` → success toast (JSON `message` or fallback) → `refresh()`.
     - **POPUP** → look up the registry (T2.6); if unregistered, fall back to navigating to `action.url`.
  2. Errors: `toast.error(getApiErrorMessage(error, t('Operation failed')))` — 401/403/419 already handled globally by `api/http.ts`.
  3. One dialog at a time; in-flight guard to prevent double-submit.
- **Test & Analyze**: vitest per action type (confirm shown/skipped, URL normalization, JSON-vs-HTML toast semantics, refresh called).
- **Commit**: `feat(tables): add unified action executor for GOTO/GET/DELETE/POPUP`

---

## Micro-Step T2.6: Popup registry

- **Files**:
  - `[NEW]` `resources/js/components/tables/crud-table/action-popup-registry.tsx`
  - `[NEW]` `resources/js/components/tables/crud-table/popup-dialog.tsx` (generic Dialog wrapper)
- **Implementation Instructions**:
  1. `registerActionPopup('sb.orders::sb.order-options', Component)` style registry, keyed `namespace::identifier`, mirroring the forms `registry.ts` pattern.
  2. Seed from the T1.6 POPUP enumeration: orders `sb.order-options`, `sb.order-refunds`; products preview/quantities; register-history details; product-history description. Components fetch/render the popup URL content; add them lazily (only what Wave 2 needs first — orders).
  3. Unknown keys → executor fallback (navigate). Log a dev-time warning (like `field-renderer.tsx` does for unknown components).
- **Test & Analyze**: vitest — registered component opens, unknown key falls back.
- **Commit**: `feat(tables): add action popup registry with navigate fallback`

---

## Micro-Step T2.7: Bulk actions + toolbar wiring

- **Files**: `[NEW]` `resources/js/components/tables/crud-table/bulk-actions.tsx`
- **Implementation Instructions**:
  1. Map `config.bulkActions` into the `DataTable` toolbar menu (label from backend).
  2. On run: optional confirm (backend bulk definitions may add `confirm` — honor if present) → `crudApi` POST `/crud/{namespace}/bulk-actions` with `{ action: identifier, entries: selectedIds }` → success toast → `refresh()` + clear selection.
  3. Guard: no selection → toast info (backend also throws "You need to select at least one item…").
- **Test & Analyze**: vitest — payload shape, confirm gate, refresh after success.
- **Commit**: `feat(tables): wire backend bulk actions into the data table toolbar`

---

## Micro-Step T2.8: `CrudTablePage` shell

- **Files**:
  - `[NEW]` `resources/js/components/tables/crud-table/crud-table-page.tsx`
- **Implementation Instructions**:
  1. Props: `{ namespace, initialConfig?, title?, description?, breadcrumbs }` (mirrors `CrudFormPage`).
  2. Compose: `AppLayout` + breadcrumbs + `Head` title → `DataTable` wired to `use-crud-table` (custom pagination + server search), `columns-builder` output, `row-actions-menu`, executor, bulk actions, `queryFilters` → `filterableColumns`.
  3. Header: Add-New / Refresh from `config.links` (type `link`) — render as `router.visit(href)` buttons; never hardcode URLs.
  4. Honor `showOptions` (hide the actions column), `showCheckboxes` (hide selection), `prependOptions` (column order).
  5. Apply `row.original.$cssClass` to each `TableRow` (status colors).
  6. States: loading skeleton, error banner with retry, empty state (`There is nothing to display...`).
- **Test & Analyze**: `npm run types && npm run lint` + smoke vitest rendering with a fixture config.
- **Commit**: `feat(tables): add CrudTablePage generic backend-driven list shell`

---

## Micro-Step T2.9: Engine vitest suite consolidation

- **Files**: `[NEW]` `resources/js/tests/unit/crud-table-engine.test.tsx`
- **Implementation Instructions**: one suite covering: query-param composition (`use-crud-table`), columns-builder output, executor semantics per action type, menu renders only permitted actions + single Copy ID, popup fallback. Use backend-shaped fixtures (real shapes from `CrudTableConfigContractTest` payloads).
- **Test & Analyze**: `npm run test`
- **Commit**: `test(tables): consolidate crud-table engine vitest coverage`
- **Exit Criteria (Phase 2 complete)**: engine compiles, all vitest suites green, `docs/agents/architecture.md` NOT yet updated (that lands in Phase 6).

