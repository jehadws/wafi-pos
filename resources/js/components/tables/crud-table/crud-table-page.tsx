/**
 * crud-table-page.tsx
 *
 * The generic backend-driven list shell (Plan T2.8) — the tables
 * counterpart of `CrudFormPage`. A page migrates by rendering THIS
 * component (there is exactly one Inertia route component:
 * `resources/js/pages/crud/list.tsx`); no per-page shells exist.
 *
 * Composition:
 *  - `AppLayout` + breadcrumbs + `Head` title.
 *  - `use-crud-table` for config/entries state (custom pagination +
 *    server-side search + server-side sort).
 *  - `columns-builder` output, with the checkbox column, actions column
 *    (`row-actions-menu` → executor) and `showOptions`/`showCheckboxes`/
 *    `prependOptions` honored.
 *  - `queryFilters` (select-type) → `DataTable` faceted filters; the
 *    resolved filter state is translated into server-side `queryFilters`
 *    through `onColumnFiltersChange`. `daterangepicker` filters are
 *    deferred — the pages that need them (orders, account history) keep
 *    bespoke dialogs in Waves 2/5.
 *  - `use-bulk-actions` for the toolbar menu; Add-New/Refresh resolve from
 *    `config.links` (never hardcoded).
 *  - `ConfirmationDialog` (single dialog, shared by row + bulk actions) and
 *    the popup registry host.
 *  - States: loading skeleton, error banner with retry, empty state.
 */

import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import { DataTable } from '@/components/ui/data-table/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import type { BreadcrumbItem } from '@/types';
import type { CrudEntryRow, CrudTableConfig, CrudTableLink } from '@/types/tables';
import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { getActionPopup } from './action-popup-registry';
import { useBulkActions } from './bulk-actions';
import { buildCrudColumns, type CrudSortDirection } from './columns-builder';
import { RowActionsMenu } from './row-actions-menu';
import { normalizeBackendUrl, useActionExecutor } from './use-action-executor';
import { useCrudTable } from './use-crud-table';

// ---------------------------------------------------------------------------
// Public props
// ---------------------------------------------------------------------------

export interface CrudTablePageProps {
  /** CRUD namespace, e.g. `'sb.units'`. */
  namespace: string;
  /** Pre-fetched config (Inertia `initialConfig` prop). */
  initialConfig?: CrudTableConfig;
  /** Page title; falls back to `config.labels.list_title`. */
  title?: string;
  /** Page description; falls back to `config.labels.list_description`. */
  description?: string;
  /** Breadcrumb trail for `AppLayout`. */
  breadcrumbs?: BreadcrumbItem[];
  /** Sub-list scoping (e.g. `{ coupon_id: '3' }`) → `initialQuery`. */
  queryParams?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// queryFilters mapping helpers
// ---------------------------------------------------------------------------

/** Filter types the faceted toolbar can express today. */
const FACETED_FILTER_TYPES = new Set(['select', 'multiselect']);

function isFacetedFilter(filter: { type: string; options?: unknown }): boolean {
  return FACETED_FILTER_TYPES.has(filter.type) && Array.isArray(filter.options);
}

/** `filterableColumns` shape consumed by `DataTable`. */
interface FilterableColumn {
  id: string;
  title: string;
  options: { label: string; value: string }[];
}

export function buildFilterableColumns(config: CrudTableConfig, t: (key: string) => string): FilterableColumn[] {
  return (config.queryFilters ?? []).filter(isFacetedFilter).map((filter) => ({
    id: filter.name,
    title: t(filter.label),
    options: (filter.options ?? []).map((option) => ({ label: String(option.label), value: String(option.value) })),
  }));
}

/**
 * Resolved faceted-filter state → server `queryFilters`. The backend
 * applies filter values with a scalar `where` (`CrudService.php:853-864`),
 * so a multi-pick narrows to the first selected value; `daterangepicker`
 * filters are deferred and skipped here.
 */
export function filterStateToQueryFilters(state: Array<{ id: string; value: unknown }>, config: CrudTableConfig): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  for (const entry of state) {
    const definition = config.queryFilters?.find((filter) => filter.name === entry.id);
    if (!definition || !isFacetedFilter(definition)) {
      continue;
    }

    const values = Array.isArray(entry.value) ? entry.value : [entry.value];
    if (values.length > 0) {
      filters[entry.id] = values[0];
    }
  }

  return filters;
}

/** The Add-New link resolves from the backend links — never a hardcoded URL. */
export function getCreateLink(config: CrudTableConfig | null): CrudTableLink | undefined {
  if (!config) {
    return undefined;
  }
  return config.links?.find((link) => !link.href.includes('/api/') && (link.label === config.labels?.create_new || /\/create\/?$/.test(link.href)));
}

/**
 * Wire the queryFilters into the tanstack columns:
 *  - columns that carry a faceted filter get a no-op `filterFn` (server
 *    pages must never be client-filtered);
 *  - filters without a matching column (e.g. `subul_orders.author`) get a
 *    hidden filter-only column so `table.getColumn(id)` resolves.
 */
export function wireQueryFilterColumns(
  columns: ColumnDef<CrudEntryRow, unknown>[],
  config: CrudTableConfig,
): { columns: ColumnDef<CrudEntryRow, unknown>[]; visibility: Record<string, boolean> } {
  const filterIds = (config.queryFilters ?? []).filter(isFacetedFilter).map((filter) => filter.name);
  const existing = new Set(columns.map((column) => column.id));

  const wired = columns.map((column) => (column.id && filterIds.includes(column.id) ? { ...column, filterFn: () => true } : column));

  const visibility: Record<string, boolean> = {};
  const extras = filterIds
    .filter((id) => !existing.has(id))
    .map((id) => {
      visibility[id] = false;
      return {
        id,
        accessorFn: () => '',
        header: () => null,
        cell: () => null,
        enableSorting: false,
        enableHiding: false,
        filterFn: () => true,
      } satisfies ColumnDef<CrudEntryRow, unknown>;
    });

  return { columns: [...wired, ...extras], visibility };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CrudTablePage({ namespace, initialConfig, title, description, breadcrumbs, queryParams }: CrudTablePageProps) {
  const { t } = useTranslation();

  const {
    config,
    entries,
    loading,
    configLoading,
    error,
    configError,
    activeSort,
    refresh,
    retry,
    setPage,
    setPerPage,
    setSearch,
    setSort,
    setQueryFilters,
  } = useCrudTable({ namespace, initialConfig, initialQuery: queryParams });

  const executor = useActionExecutor({ namespace, refresh });

  const { bulkActions } = useBulkActions({
    config: config ?? ({} as CrudTableConfig),
    requestConfirm: executor.requestConfirm,
    refresh,
  });

  const handleFilterChange = useCallback(
    (state: Array<{ id: string; value: unknown }>) => {
      if (!config) {
        return;
      }
      setQueryFilters(filterStateToQueryFilters(state, config));
    },
    [config, setQueryFilters],
  );

  const columns = useMemo(() => {
    if (!config) {
      return [];
    }
    const built = buildCrudColumns({
      config,
      t,
      onSort: (key: string, direction: CrudSortDirection) => setSort(key, direction),
      activeSort,
      renderActions: (row: CrudEntryRow) => (
        <RowActionsMenu row={row} onRunAction={(target, action) => void executor.runAction(target, action)} disabled={executor.inFlight} />
      ),
    });
    return wireQueryFilterColumns(built, config).columns;
  }, [config, t, setSort, activeSort, executor]);

  const visibility = useMemo(() => (config ? wireQueryFilterColumns([], config).visibility : {}), [config]);
  const filterableColumns = useMemo(() => (config ? buildFilterableColumns(config, t) : []), [config, t]);
  const createLink = getCreateLink(config);

  const pageTitle = title ?? config?.labels?.list_title ?? namespace;
  const pageDescription = description ?? config?.labels?.list_description;

  const tableData: CustomPaginationData<CrudEntryRow> = entries ?? {
    current_page: 1,
    data: [],
    next_page_url: null,
    path: '',
    prev_page_url: null,
    first_page_url: '',
    last_page_url: '',
    last_page: 1,
    per_page: 20,
    from: 0,
    to: 0,
    total: 0,
  };

  const popupComponent = executor.popupState ? getActionPopup(namespace, executor.popupState.action.identifier) : null;

  const handleAddNew = () => {
    if (createLink) {
      router.visit(normalizeBackendUrl(createLink.href));
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={pageTitle} />

      <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
        {/* ── Config loading skeleton ── */}
        {(configLoading || !config) && !configError && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-[250px]" />
              <div className="ms-auto flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" />
            {[0, 1, 2, 3, 4].map((index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        )}

        {/* ── Config fetch error ── */}
        {!configLoading && configError && (
          <div
            role="alert"
            className="border-destructive/50 bg-destructive/10 text-destructive flex flex-col gap-3 rounded-md border px-4 py-3 text-sm"
          >
            <span>{configError}</span>
            <button type="button" className="text-start underline" onClick={retry}>
              {t('Try again')}
            </button>
          </div>
        )}

        {/* ── Entries fetch error banner ── */}
        {!configError && error && (
          <div
            role="alert"
            className="border-destructive/50 bg-destructive/10 text-destructive flex flex-col gap-3 rounded-md border px-4 py-3 text-sm"
          >
            <span>{error}</span>
            <button type="button" className="text-start underline" onClick={refresh}>
              {t('Try again')}
            </button>
          </div>
        )}

        {/* ── Table ── */}
        {config && (
          <DataTable
            columns={columns}
            data={tableData}
            title={pageTitle}
            description={pageDescription}
            filterableColumns={filterableColumns}
            bulkActions={bulkActions}
            initialColumnVisibility={visibility}
            initialPageSize={20}
            onAddNew={createLink ? handleAddNew : undefined}
            onRefresh={refresh}
            useCustomPagination
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
            useServerSideSearch
            onSearch={setSearch}
            isLoading={loading || configLoading}
            rowClassName={(row: CrudEntryRow) => (typeof row.$cssClass === 'string' ? row.$cssClass : undefined)}
            onColumnFiltersChange={handleFilterChange}
          />
        )}
      </div>

      {/* ── The single shared confirm dialog ── */}
      <ConfirmationDialog
        isOpen={!!executor.confirmState}
        onClose={executor.declineConfirm}
        onConfirm={executor.acceptConfirm}
        title={executor.confirmState?.title}
        description={executor.confirmState?.message}
        variant={executor.confirmState?.destructive ? 'destructive' : 'default'}
        loading={executor.inFlight}
      />

      {/* ── Popup host (registry component) ── */}
      {executor.popupState && popupComponent
        ? (() => {
            const Popup = popupComponent;
            return <Popup open onClose={executor.closePopup} action={executor.popupState.action} row={executor.popupState.row} />;
          })()
        : null}
    </AppLayout>
  );
}

export default CrudTablePage;
