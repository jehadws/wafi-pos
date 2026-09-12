/**
 * Backend table definitions — the frontend contract for the CRUD list tables.
 *
 * Sources of truth (see `docs/plans/backend-driven-tables/`):
 * - `GET /api/crud/{ns}/config` → `CrudService::getTableConfig()`
 *   (`app/Services/CrudService.php:1214-1231`) via `CrudController@getConfig`
 * - Column factory keys: `app/Classes/CrudTable.php::column()` — `{label,
 *   identifier, $sort, $direction, width, ...}` keyed by `identifier`
 * - Row actions: `CrudEntry::action()` (`app/Services/CrudEntry.php:70-73`),
 *   serialized per row as `$actions` and permission-filtered server-side
 *   (`CrudEntry::filterActions()`, `jsonSerialize()`) — the frontend never
 *   re-filters by permission
 * - Header links: `CrudService::getFilteredLinks()` serializing `CrudLink`
 *   (`app/Services/CrudLink.php`) to `{type: 'link', href, label}`
 * - Bulk actions: `CrudService::getBulkActions()` — `{label, identifier[, url]}`
 * - Entries: `GET /api/crud/{ns}` → `CrudService::getEntries()` returns a
 *   Laravel paginator whose rows carry `$id`, `$actions`, `$cssClass` and
 *   `__raw` (raw uncasted values — renderers ignore it)
 */

/** Action types emitted by `CrudEntry::action()`. */
export type CrudActionType = 'GOTO' | 'DELETE' | 'GET' | 'POPUP';

/** Serialized confirm payload of an action (`CrudEntry::action($confirm)`). */
export interface CrudActionConfirm {
  message: string;
  title?: string;
}

/**
 * One row-level action of `CrudEntryRow.$actions`, keyed by `identifier`.
 * The backend already strips actions the user may not run — never filter
 * by `permissions` client-side.
 */
export interface CrudRowAction {
  label: string;
  identifier: string;
  url: string;
  /** `null` when the backend action carries no confirm payload. */
  confirm?: CrudActionConfirm | null;
  type: CrudActionType;
  permissions: string[];
}

/**
 * One column definition (`CrudTable::column()` output). `$direction` carries
 * the default sorting direction; `$sort === false` disables sorting for the
 * column on both sides (the backend throws when asked to sort it).
 */
export interface CrudColumnDef {
  label: string;
  $direction?: string;
  $sort?: boolean;
  width?: string;
  [key: string]: unknown;
}

/**
 * One server-side query filter (`CrudService::$queryFilters`). `type`
 * mirrors the backend definitions — `select` carries `{label, value}[]
 * options`, `daterangepicker` a `{startDate, endDate}` object.
 */
export interface CrudQueryFilter {
  name: string;
  label: string;
  type: string;
  description?: string;
  operator?: string;
  options?: Array<{ label: string; value: string | number }>;
  [key: string]: unknown;
}

/** One bulk action (`CrudService::getBulkActions()`). */
export interface CrudBulkAction {
  label: string;
  identifier: string;
  url?: string;
}

/** Serialized header link (`CrudLink::jsonSerialize()`). */
export interface CrudTableLink {
  type: 'link';
  href: string;
  label: string;
}

/** `GET /api/crud/{ns}/config` response (`CrudService::getTableConfig`). */
export interface CrudTableConfig {
  columns: Record<string, CrudColumnDef>;
  queryFilters: CrudQueryFilter[];
  labels: Record<string, string>;
  links: CrudTableLink[];
  bulkActions: CrudBulkAction[];
  prependOptions: boolean;
  showOptions: boolean;
  showCheckboxes: boolean;
  headerButtons: unknown[];
  namespace: string;
}

/**
 * One row of `GET /api/crud/{ns}` (`CrudEntry::jsonSerialize()`). Column
 * values are backend pre-formatted strings; `$actions` drives the row menu;
 * `$cssClass` is a row-level class (status colors); `__raw` is ignored by
 * renderers.
 */
export type CrudEntryRow = Record<string, unknown> & {
  $id?: number | string;
  $cssClass?: string;
  $actions?: Record<string, CrudRowAction>;
};
