/**
 * columns-builder.ts
 *
 * Translates the backend column definitions (`CrudTableConfig.columns`,
 * `CrudTable::column()` output) into tanstack `ColumnDef`s for the
 * `DataTable` (Plan T2.3).
 *
 * Rules:
 *  - Backend key order is preserved (`Object.entries` keeps insertion order).
 *  - `header` is the translated label; `size` comes from the column `width`.
 *  - Server-side sorting: `enableSorting` mirrors `$sort !== false`, and a
 *    sortable header is a button that reports `setSort(key, direction)` —
 *    the engine never uses tanstack's local sort model for server pages.
 *  - Cell rendering: the backend pre-formats most values in the resource's
 *    `setActions()` (see `CrudEntry`), so the default renderer stringifies
 *    the raw value; date-ish keys (`*_at`) go through `formatDateTime` when
 *    the value parses as a date; null/empty renders as an em dash (the
 *    backend's own "N/A" placeholders arrive as plain strings and pass
 *    through unchanged).
 *  - The checkbox column is prepended per `config.showCheckboxes`; the
 *    actions column is prepended/appended per `config.prependOptions` /
 *    `config.showOptions`. Row-level `$cssClass` is applied by the shell
 *    (crud-table-page), not here.
 */

import { Checkbox } from '@/components/ui/checkbox';
import type { CrudColumnDef, CrudEntryRow, CrudTableConfig } from '@/types/tables';
import { formatDateTime } from '@/utils/format';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { createElement, type ReactNode } from 'react';

/** Sort direction of the server-side query. */
export type CrudSortDirection = 'asc' | 'desc';

/** Currently active server-side sort. */
export interface CrudActiveSort {
  key: string;
  direction: CrudSortDirection;
}

export interface BuildCrudColumnsOptions {
  config: CrudTableConfig;
  /** Translator (from `useTranslation`). */
  t: (key: string) => string;
  /**
   * Server-side sort handler — invoked by the sortable headers. When
   * omitted, headers render as plain labels (no sort affordance).
   */
  onSort?: (key: string, direction: CrudSortDirection) => void;
  /** Drives the header sort indicator. */
  activeSort?: CrudActiveSort | null;
  /**
   * Renders the actions cell content (the T2.4 row-actions-menu, wired by
   * the shell). When omitted the actions column renders nothing — unit
   * tests use this to stay menu-free.
   */
  renderActions?: (row: CrudEntryRow) => ReactNode;
}

/** Em dash used for null/empty cells. */
const EMPTY_CELL = '—';

/** Keys rendered through the date convention (`*_at`, e.g. `created_at`). */
export function isDateishKey(key: string): boolean {
  return /_at$/.test(key);
}

/** Whether a string value parses as a date (safe for `formatDateTime`). */
export function parsesAsDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

/**
 * Default cell renderer: stringifies the backend value, applies the date
 * convention for `*_at` keys and the em dash for null/empty.
 */
export function crudCellValue(value: unknown, key: string): string {
  if (value === null || value === undefined || value === '') {
    return EMPTY_CELL;
  }

  if (isDateishKey(key) && typeof value === 'string' && parsesAsDate(value)) {
    return formatDateTime(value);
  }

  return String(value);
}

/**
 * Next direction when a sortable header is clicked: `asc` for a new column,
 * the opposite of the current direction when toggling.
 */
export function nextSortDirection(activeSort: CrudActiveSort | null | undefined, key: string): CrudSortDirection {
  if (activeSort && activeSort.key === key) {
    return activeSort.direction === 'asc' ? 'desc' : 'asc';
  }
  return 'asc';
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildCrudColumns(options: BuildCrudColumnsOptions): ColumnDef<CrudEntryRow, unknown>[] {
  const { config, t, onSort, activeSort, renderActions } = options;

  const dataColumns: ColumnDef<CrudEntryRow, unknown>[] = Object.entries(config.columns ?? {}).map(([key, def]) =>
    buildDataColumn(key, def as CrudColumnDef, { t, onSort, activeSort }),
  );

  const actionsColumn: ColumnDef<CrudEntryRow, unknown> = {
    id: 'actions',
    header: () => null,
    enableSorting: false,
    enableHiding: false,
    size: 50,
    cell: ({ row }) => (renderActions ? renderActions(row.original) : null),
  };

  const checkboxColumn: ColumnDef<CrudEntryRow, unknown> = {
    id: 'select',
    header: ({ table }) =>
      createElement(Checkbox, {
        checked: table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
        onCheckedChange: (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
        'aria-label': t('Select all'),
      }),
    cell: ({ row }) =>
      createElement(Checkbox, {
        checked: row.getIsSelected(),
        onCheckedChange: (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'aria-label': t('Select row'),
      }),
    enableSorting: false,
    enableHiding: false,
    size: 24,
  };

  const columns: ColumnDef<CrudEntryRow, unknown>[] = [...dataColumns];

  if (config.showOptions) {
    // The actions column rides in front of the data columns when the
    // backend asks for prepended options (`prependOptions`).
    if (config.prependOptions) {
      columns.unshift(actionsColumn);
    } else {
      columns.push(actionsColumn);
    }
  }

  if (config.showCheckboxes) {
    columns.unshift(checkboxColumn);
  }

  return columns;
}

// ---------------------------------------------------------------------------
// Single data column
// ---------------------------------------------------------------------------

function buildDataColumn(
  key: string,
  def: CrudColumnDef,
  { t, onSort, activeSort }: Pick<BuildCrudColumnsOptions, 't' | 'onSort' | 'activeSort'>,
): ColumnDef<CrudEntryRow, unknown> {
  const sortable = def.$sort !== false;

  const column: ColumnDef<CrudEntryRow, unknown> = {
    // `accessorFn` over `accessorKey`: backend keys may contain characters
    // tanstack would treat as deep paths (e.g. dots).
    id: key,
    accessorFn: (row) => row[key],
    header: sortable && onSort ? buildSortableHeader(key, def, { t, onSort, activeSort }) : t(def.label),
    enableSorting: sortable,
    cell: ({ row }) => crudCellValue(row.original[key], key),
  };

  const width = typeof def.width === 'string' ? parseInt(def.width, 10) : Number.NaN;
  if (!Number.isNaN(width)) {
    column.size = width;
  }

  return column;
}

function buildSortableHeader(
  key: string,
  def: CrudColumnDef,
  { t, onSort, activeSort }: Pick<BuildCrudColumnsOptions, 't' | 'onSort' | 'activeSort'>,
): NonNullable<ColumnDef<CrudEntryRow, unknown>['header']> {
  return () => {
    const isActive = !!activeSort && activeSort.key === key;
    const direction = isActive ? activeSort.direction : null;
    const Indicator = isActive ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return createElement(
      'button',
      {
        type: 'button',
        className: 'flex items-center gap-1',
        onClick: () => onSort?.(key, nextSortDirection(activeSort, key)),
      },
      t(def.label),
      createElement(Indicator, { className: 'h-4 w-4 opacity-50' }),
    );
  };
}
