/**
 * crud-table-engine.test.tsx
 *
 * Consolidated vitest coverage for the backend-driven table engine
 * (`components/tables/crud-table/`) — Plan T2.9. One suite covering:
 *
 *  - T2.2 use-crud-table: query-param composition (`page`/`per_page`/
 *    `search`/`active`+`direction`/`queryFilters` JSON), sorting guard,
 *    debounce, refresh and error states.
 *  - T2.3 columns-builder: column order, sorting flags, date convention,
 *    empty-value rendering, header sort wiring.
 *  - T2.4 row-actions-menu: renders only the backend actions, exactly one
 *    Copy ID, destructive styling for DELETE.
 *  - T2.5 use-action-executor: semantics per action type (confirm gates,
 *    GOTO URL normalization, JSON-vs-HTML toast semantics, refresh).
 *  - T2.6 popup registry: registered components resolve, unknown keys fall
 *    back to navigation.
 *  - T2.7 useBulkActions: payload shape, confirm gate, refresh, guards.
 *  - T2.8 CrudTablePage: filter mapping helpers + shell smoke.
 *
 * Fixtures mirror the real backend shapes pinned by
 * `tests/Feature/CrudTableConfigContractTest.php` and
 * `tests/Feature/CrudEntryActionsContractTest.php`.
 */

import { crudApi } from '@/api/crud';
import { del, get } from '@/api/http';
import { clearActionPopups, getActionPopup, popupKey, registerActionPopup } from '@/components/tables/crud-table/action-popup-registry';
import { useBulkActions } from '@/components/tables/crud-table/bulk-actions';
import { buildCrudColumns, crudCellValue, isDateishKey, nextSortDirection } from '@/components/tables/crud-table/columns-builder';
import CrudTablePage, {
  buildFilterableColumns,
  filterStateToQueryFilters,
  getCreateLink,
  wireQueryFilterColumns,
} from '@/components/tables/crud-table/crud-table-page';
import { PopupDialog } from '@/components/tables/crud-table/popup-dialog';
import { RowActionsMenu } from '@/components/tables/crud-table/row-actions-menu';
import { useActionExecutor } from '@/components/tables/crud-table/use-action-executor';
import { useCrudTable } from '@/components/tables/crud-table/use-crud-table';
import type { CrudEntryRow, CrudRowAction, CrudTableConfig } from '@/types/tables';
import { router } from '@inertiajs/react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('@/utils/format', () => ({
  formatDateTime: (value: string) => `DT(${value})`,
}));

vi.mock('@/api/http', () => ({
  get: vi.fn(),
  del: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
  router: { visit: vi.fn() },
  Head: ({ title }: { title?: string }) => <head data-testid="head">{title && <title>{title}</title>}</head>,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/api/crud', () => ({
  crudApi: {
    list: vi.fn(),
    tableConfig: vi.fn(),
    bulkActions: vi.fn(),
  },
}));

vi.mock('@/layouts/app-layout', () => ({
  default: ({ children }: { children?: import('react').ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

// Real registry API, but `getActionPopup` is a delegating spy (overridden per test).
vi.mock('@/components/tables/crud-table/action-popup-registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/tables/crud-table/action-popup-registry')>();
  return {
    ...actual,
    getActionPopup: vi.fn(actual.getActionPopup),
  };
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const t = (key: string) => key;

export function makeTableConfig(overrides: Partial<CrudTableConfig> = {}): CrudTableConfig {
  return {
    columns: {
      code: { label: 'Code', $direction: '', $sort: true, width: '170px' },
      name: { label: 'Name', $direction: '', $sort: true },
      total: { label: 'Total', $direction: '', $sort: false },
      created_at: { label: 'Created At', $direction: '', $sort: true },
    },
    queryFilters: [],
    labels: { list_title: 'Orders List', list_description: 'List of orders' },
    links: [{ type: 'link', href: 'http://localhost/dashboard/orders/create', label: 'Add a new order' }],
    bulkActions: [{ label: 'Delete Selected', identifier: 'delete_selected', url: 'http://localhost/api/crud/sb.orders/bulk-actions' }],
    prependOptions: false,
    showOptions: true,
    showCheckboxes: true,
    headerButtons: [],
    namespace: 'sb.orders',
    ...overrides,
  };
}

export function makeRow(overrides: Partial<CrudEntryRow> = {}): CrudEntryRow {
  return {
    id: 7,
    $id: 7,
    code: 'ORD-0007',
    name: 'Walk-in order',
    total: '12.50',
    created_at: '2026-09-12 10:30:00',
    $actions: {},
    ...overrides,
  };
}

export function makePaginator(rows: CrudEntryRow[] = [makeRow()]): CustomPaginationData<CrudEntryRow> {
  return {
    current_page: 1,
    data: rows,
    next_page_url: null,
    path: '',
    prev_page_url: null,
    first_page_url: '',
    last_page_url: '',
    last_page: 1,
    per_page: 20,
    from: 1,
    to: rows.length,
    total: rows.length,
  };
}

// ---------------------------------------------------------------------------
// T2.2 — use-crud-table (query-param composition, consolidated from the
// colocated hook test per T2.9)
// ---------------------------------------------------------------------------

describe('useCrudTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (crudApi.list as Mock).mockResolvedValue(makePaginator());
  });

  /** Flush the in-flight entries/config promises. */
  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('uses initialConfig directly without fetching the config', async () => {
    const cfg = makeTableConfig();
    renderHook(() => useCrudTable({ namespace: 'sb.orders', initialConfig: cfg }));
    await flush();

    expect(crudApi.tableConfig).not.toHaveBeenCalled();
    expect(crudApi.list).toHaveBeenCalledWith('sb.orders', { page: 1, per_page: 20 });
  });

  it('fetches the config via crudApi.tableConfig when absent', async () => {
    (crudApi.tableConfig as Mock).mockResolvedValue(makeTableConfig());
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.orders' }));

    expect(result.current.configLoading).toBe(true);
    await waitFor(() => expect(result.current.configLoading).toBe(false));

    expect(crudApi.tableConfig).toHaveBeenCalledWith('sb.orders');
    expect(result.current.config?.namespace).toBe('sb.orders');
  });

  it('exposes the config error on a config fetch failure', async () => {
    (crudApi.tableConfig as Mock).mockRejectedValue({
      response: { data: { message: 'Not allowed.' } },
    });
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.orders' }));
    await waitFor(() => expect(result.current.configLoading).toBe(false));

    expect(result.current.config).toBeNull();
    expect(result.current.configError).toBe('Not allowed.');
  });

  it('sends search and resets the page when searching (debounced)', async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useCrudTable({ namespace: 'sb.orders' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      (crudApi.list as Mock).mockClear();

      act(() => {
        result.current.setSearch('piece');
      });

      // Not committed before the debounce elapses.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(crudApi.list).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(crudApi.list).toHaveBeenCalledWith('sb.orders', { page: 1, per_page: 20, search: 'piece' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('sends active and direction only together', async () => {
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.orders', initialConfig: makeTableConfig() }));
    await flush();

    act(() => {
      result.current.setSort('code', 'asc');
    });
    await flush();

    expect(crudApi.list).toHaveBeenLastCalledWith('sb.orders', {
      page: 1,
      per_page: 20,
      active: 'code',
      direction: 'asc',
    });

    act(() => {
      result.current.setSort('code', null);
    });
    await flush();

    const params = (crudApi.list as Mock).mock.calls.at(-1)?.[1] as Record<string, unknown>;
    expect(params).not.toHaveProperty('active');
    expect(params).not.toHaveProperty('direction');
  });

  it('never sends active/direction for a $sort === false column', async () => {
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.orders', initialConfig: makeTableConfig() }));
    await flush();

    act(() => {
      result.current.setSort('total', 'asc');
    });
    await flush();

    const params = (crudApi.list as Mock).mock.calls.at(-1)?.[1] as Record<string, unknown>;
    expect(params).not.toHaveProperty('active');
    expect(params).not.toHaveProperty('direction');
  });

  it('sends queryFilters as JSON with initialQuery merged inside', async () => {
    const { result } = renderHook(() =>
      useCrudTable({
        namespace: 'sb.coupons',
        initialConfig: makeTableConfig({ namespace: 'sb.coupons' }),
        initialQuery: { coupon_id: '3' },
      }),
    );
    await flush();

    expect((crudApi.list as Mock).mock.calls[0][1]).toHaveProperty('queryFilters', JSON.stringify({ coupon_id: '3' }));

    act(() => {
      result.current.setQueryFilters({ payment_status: 'paid' });
    });
    await flush();

    expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).toHaveProperty(
      'queryFilters',
      JSON.stringify({ coupon_id: '3', payment_status: 'paid' }),
    );
  });

  it('resets the page on setPerPage and setQueryFilters', async () => {
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.orders', initialConfig: makeTableConfig() }));
    await flush();

    act(() => {
      result.current.setPage(3);
    });
    await flush();
    expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).toMatchObject({ page: 3 });

    act(() => {
      result.current.setPerPage(50);
    });
    await flush();
    expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).toMatchObject({ page: 1, per_page: 50 });

    act(() => {
      result.current.setPage(2);
    });
    await flush();

    act(() => {
      result.current.setQueryFilters({ group_id: 2 });
    });
    await flush();
    expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).toMatchObject({ page: 1 });
  });

  it('refresh() re-fetches the entries', async () => {
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.orders', initialConfig: makeTableConfig() }));
    await flush();
    expect(crudApi.list).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(crudApi.list).toHaveBeenCalledTimes(2);
  });

  it('exposes the error state and rows on an entries fetch failure', async () => {
    (crudApi.list as Mock).mockRejectedValue({
      response: { data: { message: 'Sorting is explicitly disabled for the column "Total".' } },
    });
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.orders', initialConfig: makeTableConfig() }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Sorting is explicitly disabled for the column "Total".');
    expect(result.current.rows).toEqual([]);
  });

  it('exposes the active sort for the header indicators', async () => {
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.orders', initialConfig: makeTableConfig() }));
    await flush();
    expect(result.current.activeSort).toBeNull();

    act(() => {
      result.current.setSort('code', 'desc');
    });
    await flush();

    expect(result.current.activeSort).toEqual({ key: 'code', direction: 'desc' });
  });
});

// ---------------------------------------------------------------------------
// T2.3 — columns-builder
// ---------------------------------------------------------------------------

describe('columns-builder', () => {
  it('preserves the backend key order and prepends checkbox + actions columns', () => {
    const columns = buildCrudColumns({ config: makeTableConfig(), t });

    expect(columns.map((column) => column.id)).toEqual(['select', 'code', 'name', 'total', 'created_at', 'actions']);
  });

  it('prepends the actions column when prependOptions is set', () => {
    const columns = buildCrudColumns({ config: makeTableConfig({ prependOptions: true }), t });

    expect(columns.map((column) => column.id)).toEqual(['select', 'actions', 'code', 'name', 'total', 'created_at']);
  });

  it('hides the actions column when showOptions is false and the checkbox column when showCheckboxes is false', () => {
    const columns = buildCrudColumns({ config: makeTableConfig({ showOptions: false, showCheckboxes: false }), t });

    expect(columns.map((column) => column.id)).toEqual(['code', 'name', 'total', 'created_at']);
  });

  it('translates labels and derives the tanstack size from the backend width', () => {
    const columns = buildCrudColumns({ config: makeTableConfig(), t });
    const code = columns.find((column) => column.id === 'code');

    expect(code?.header).toBe('Code');
    expect(code?.size).toBe(170);
  });

  it('mirrors the backend $sort flag into enableSorting', () => {
    const columns = buildCrudColumns({ config: makeTableConfig(), t });

    expect(columns.find((column) => column.id === 'code')?.enableSorting).toBe(true);
    // `$sort === false` never enables sorting (the backend throws on it).
    expect(columns.find((column) => column.id === 'total')?.enableSorting).toBe(false);
  });

  it('renders date-ish cells through the date convention and keeps other values raw', () => {
    const row = makeRow({ created_at: '2026-09-12 10:30:00', name: 'Plain' });

    expect(crudCellValue(row.created_at, 'created_at')).toBe('DT(2026-09-12 10:30:00)');
    expect(crudCellValue(row.name, 'name')).toBe('Plain');
    expect(crudCellValue(42, 'quantity')).toBe('42');
  });

  it('renders null/empty cells as an em dash and keeps backend N/A placeholders', () => {
    expect(crudCellValue(null, 'name')).toBe('—');
    expect(crudCellValue(undefined, 'name')).toBe('—');
    expect(crudCellValue('', 'name')).toBe('—');
    expect(crudCellValue('N/A', 'customer_first_name')).toBe('N/A');
  });

  it('ignores non-date strings on date-ish keys (backend placeholders survive)', () => {
    expect(crudCellValue('N/A', 'updated_at')).toBe('N/A');
    expect(isDateishKey('created_at')).toBe(true);
    expect(isDateishKey('name')).toBe(false);
  });

  it('wires sortable headers to the onSort handler and toggles direction', () => {
    const onSort = vi.fn();
    const columns = buildCrudColumns({ config: makeTableConfig(), t, onSort, activeSort: null });
    const header = columns.find((column) => column.id === 'code')?.header as (context: unknown) => unknown;

    expect(typeof header).toBe('function');
    // The header renders a button whose click reports the sort.
    const element = header({ table: {} }) as { props: { onClick: () => void } };
    element.props.onClick();

    expect(onSort).toHaveBeenCalledWith('code', 'asc');

    // Toggling an active sort flips the direction.
    expect(nextSortDirection({ key: 'code', direction: 'asc' }, 'code')).toBe('desc');
    expect(nextSortDirection({ key: 'code', direction: 'desc' }, 'code')).toBe('asc');
    expect(nextSortDirection(null, 'code')).toBe('asc');
  });

  it('renders plain (non-sortable) headers when no onSort handler is given', () => {
    const columns = buildCrudColumns({ config: makeTableConfig(), t });

    expect(columns.find((column) => column.id === 'code')?.header).toBe('Code');
  });

  it('delegates the actions cell to the injected renderActions', () => {
    const renderActions = vi.fn((row: CrudEntryRow) => `menu:${row.$id}`);
    const columns = buildCrudColumns({ config: makeTableConfig(), t, renderActions });
    const actionsColumn = columns.find((column) => column.id === 'actions');

    const cell = actionsColumn?.cell as (context: { row: { original: CrudEntryRow } }) => unknown;
    expect(cell({ row: { original: makeRow() } })).toBe('menu:7');
  });
});

// ---------------------------------------------------------------------------
// T2.4 — row-actions-menu
// ---------------------------------------------------------------------------

describe('row-actions-menu', () => {
  const editAction: CrudRowAction = {
    label: 'Edit',
    identifier: 'edit',
    url: 'http://localhost/dashboard/orders/edit/7',
    confirm: null,
    type: 'GOTO',
    permissions: [],
  };
  const deleteAction: CrudRowAction = {
    label: 'Delete',
    identifier: 'delete',
    url: 'http://localhost/api/crud/sb.orders/7',
    confirm: { title: 'Confirm Your Action', message: 'Would you like to delete this ?' },
    type: 'DELETE',
    permissions: [],
  };

  const renderMenu = (overrides: Partial<CrudEntryRow> = {}, onRunAction = vi.fn()) => {
    render(<RowActionsMenu row={makeRow(overrides)} onRunAction={onRunAction} />);
    return onRunAction;
  };

  const openMenu = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  };

  it('renders strictly the provided backend actions in insertion order', async () => {
    renderMenu({ $actions: { edit: editAction, delete: deleteAction } });
    await openMenu();

    const items = screen.getAllByRole('menuitem');
    // Backend actions first (insertion order), then the single built-in Copy ID.
    expect(items.map((item) => item.textContent)).toEqual(['Edit', 'Delete', 'Copy ID']);
    expect(screen.queryByText('Clone')).toBeNull();
  });

  it('renders exactly one built-in Copy ID item that copies row.$id', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderMenu();
    await openMenu();

    expect(screen.getAllByText('Copy ID')).toHaveLength(1);

    await userEvent.click(screen.getByText('Copy ID'));
    expect(writeText).toHaveBeenCalledWith('7');
  });

  it('styles DELETE actions as destructive and dispatches clicks to the executor', async () => {
    const onRunAction = renderMenu({ $actions: { edit: editAction, delete: deleteAction } });
    await openMenu();

    const deleteItem = screen.getByText('Delete');
    expect(deleteItem.className).toContain('text-destructive');

    await userEvent.click(deleteItem);
    expect(onRunAction).toHaveBeenCalledWith(expect.objectContaining({ $id: 7 }), expect.objectContaining({ identifier: 'delete', type: 'DELETE' }));
  });

  it('does not style non-destructive actions', async () => {
    renderMenu({ $actions: { edit: editAction } });
    await openMenu();

    // The shadcn item base classes carry `data-[variant=destructive]:text-destructive`
    // as a substring — match the exact class token instead.
    const classes = screen.getByText('Edit').className.split(/\s+/);
    expect(classes).not.toContain('text-destructive');
  });

  it('disables the trigger while an action is in-flight', () => {
    render(<RowActionsMenu row={makeRow({ $actions: { edit: editAction } })} onRunAction={vi.fn()} disabled />);

    expect((screen.getByRole('button', { name: 'Open menu' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T2.5 — use-action-executor
// ---------------------------------------------------------------------------

describe('use-action-executor', () => {
  const gotoAction: CrudRowAction = {
    label: 'Edit',
    identifier: 'edit',
    url: 'http://localhost/dashboard/orders/edit/7',
    confirm: null,
    type: 'GOTO',
    permissions: [],
  };
  const plainGetAction: CrudRowAction = {
    label: 'Set As Paid',
    identifier: 'set-as-paid',
    url: 'http://localhost/api/procurements/7/set-as-paid',
    confirm: null,
    type: 'GET',
    permissions: [],
  };
  const confirmedGetAction: CrudRowAction = {
    label: 'Set As Paid',
    identifier: 'set-as-paid',
    url: 'http://localhost/api/procurements/7/set-as-paid',
    confirm: { message: 'Mark this procurement as paid ?' },
    type: 'GET',
    permissions: [],
  };
  const deleteAction: CrudRowAction = {
    label: 'Delete',
    identifier: 'delete',
    url: 'http://localhost/api/crud/sb.orders/7',
    confirm: null,
    type: 'DELETE',
    permissions: [],
  };
  const popupAction: CrudRowAction = {
    label: 'Options',
    identifier: 'sb.order-options',
    url: 'http://localhost/dashboard/orders/edit/7',
    confirm: null,
    type: 'POPUP',
    permissions: [],
  };

  const row = makeRow();

  /** Flush pending promises so awaited runAction branches settle. */
  const settle = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setup() {
    const refresh = vi.fn();
    const { result } = renderHook(() => useActionExecutor({ namespace: 'sb.orders', refresh }));
    return { result, refresh };
  }

  it('GOTO visits the normalized SPA path', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.runAction(row, gotoAction);
    });

    expect(router.visit).toHaveBeenCalledWith('/dashboard/orders/edit/7');
    expect(result.current.inFlight).toBe(false);
  });

  it('GET without confirm fetches, toasts only JSON messages and refreshes', async () => {
    (get as Mock).mockResolvedValue({ status: 'success', message: 'The procurement has been marked as paid.' });
    const { result, refresh } = setup();

    await act(async () => {
      await result.current.runAction(row, plainGetAction);
    });

    expect(get).toHaveBeenCalledWith('http://localhost/api/procurements/7/set-as-paid');
    expect(toast.success).toHaveBeenCalledWith('The procurement has been marked as paid.');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('GET does not toast on redirect()->back() HTML responses but still refreshes', async () => {
    (get as Mock).mockResolvedValue('<!DOCTYPE html><html>redirect target</html>');
    const { result, refresh } = setup();

    await act(async () => {
      await result.current.runAction(row, plainGetAction);
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('GET with confirm requires acceptance before the request', async () => {
    (get as Mock).mockResolvedValue({ message: 'Paid.' });
    const { result, refresh } = setup();

    let running: Promise<void> = Promise.resolve();
    act(() => {
      running = result.current.runAction(row, confirmedGetAction);
    });
    await settle();

    expect(result.current.confirmState).toEqual({
      title: 'Confirm Your Action',
      message: 'Mark this procurement as paid ?',
      destructive: false,
    });
    expect(get).not.toHaveBeenCalled();

    // Decline → nothing happens.
    act(() => {
      result.current.declineConfirm();
    });
    await act(async () => {
      await running;
    });
    expect(get).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(result.current.confirmState).toBeNull();

    // Accept → the request runs.
    act(() => {
      running = result.current.runAction(row, confirmedGetAction);
    });
    await settle();
    act(() => {
      result.current.acceptConfirm();
    });
    await act(async () => {
      await running;
    });

    expect(get).toHaveBeenCalledWith('http://localhost/api/procurements/7/set-as-paid');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('DELETE opens the destructive confirm with the standardized fallback title', async () => {
    (del as Mock).mockResolvedValue({ status: 'success', message: 'The entry has been successfully deleted.' });
    const { result } = setup();

    let running: Promise<void> = Promise.resolve();
    act(() => {
      running = result.current.runAction(row, deleteAction);
    });
    await settle();

    expect(result.current.confirmState).toEqual({
      title: 'Confirm Your Action',
      message: undefined,
      destructive: true,
    });

    act(() => {
      result.current.acceptConfirm();
    });
    await act(async () => {
      await running;
    });

    expect(del).toHaveBeenCalledWith('http://localhost/api/crud/sb.orders/7');
    expect(toast.success).toHaveBeenCalledWith('The entry has been successfully deleted.');
  });

  it('DELETE falls back to the generic success toast and refreshes', async () => {
    (del as Mock).mockResolvedValue('<html>redirect</html>');
    const { result, refresh } = setup();

    let running: Promise<void> = Promise.resolve();
    act(() => {
      running = result.current.runAction(row, deleteAction);
    });
    await settle();
    act(() => {
      result.current.acceptConfirm();
    });
    await act(async () => {
      await running;
    });

    expect(toast.success).toHaveBeenCalledWith('Successfully deleted selected item');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('DELETE declined never calls del', async () => {
    const { result } = setup();

    let running: Promise<void> = Promise.resolve();
    act(() => {
      running = result.current.runAction(row, deleteAction);
    });
    await settle();
    act(() => {
      result.current.declineConfirm();
    });
    await act(async () => {
      await running;
    });

    expect(del).not.toHaveBeenCalled();
  });

  it('surfaces API errors as error toasts', async () => {
    (get as Mock).mockRejectedValue({ response: { data: { message: 'You do not have permission.' } } });
    const { result } = setup();

    await act(async () => {
      await result.current.runAction(row, plainGetAction);
    });

    expect(toast.error).toHaveBeenCalledWith('You do not have permission.');
    expect(result.current.inFlight).toBe(false);
  });

  it('guards against double-submits while in-flight', async () => {
    let resolveGet: (value: unknown) => void = () => {};
    (get as Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );
    const { result } = setup();

    void result.current.runAction(row, plainGetAction);
    await settle();
    expect(result.current.inFlight).toBe(true);

    await result.current.runAction(row, plainGetAction);
    expect(get).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveGet({ message: 'done' });
      await Promise.resolve();
    });
    expect(result.current.inFlight).toBe(false);
  });

  it('POPUP hands the action to the registry component state', async () => {
    (getActionPopup as Mock).mockReturnValue(() => null);
    const { result } = setup();

    await act(async () => {
      await result.current.runAction(row, popupAction);
    });

    expect(router.visit).not.toHaveBeenCalled();
    expect(result.current.popupState).toEqual({ action: popupAction, row });
    expect(getActionPopup).toHaveBeenCalledWith('sb.orders', 'sb.order-options');
  });

  it('POPUP falls back to navigating the action URL when unregistered', async () => {
    (getActionPopup as Mock).mockReturnValue(null);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = setup();

    await act(async () => {
      await result.current.runAction(row, popupAction);
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('sb.orders::sb.order-options'));
    expect(router.visit).toHaveBeenCalledWith('/dashboard/orders/edit/7');
    expect(result.current.popupState).toBeNull();
    warn.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// T2.6 — action-popup-registry + popup-dialog
// ---------------------------------------------------------------------------

describe('action-popup-registry', () => {
  /** Restore the delegating spy after executor tests overrode it. */
  beforeEach(async () => {
    vi.clearAllMocks();
    const actual = await vi.importActual<typeof import('@/components/tables/crud-table/action-popup-registry')>(
      '@/components/tables/crud-table/action-popup-registry',
    );
    (getActionPopup as Mock).mockImplementation(actual.getActionPopup);
  });

  it('keys popups as namespace::identifier', () => {
    expect(popupKey('sb.orders', 'sb.order-options')).toBe('sb.orders::sb.order-options');
  });

  it('seeds the Wave-2 orders popups from the T1.6 enumeration', () => {
    expect(getActionPopup('sb.orders', 'sb.order-options')).toBeTruthy();
    expect(getActionPopup('sb.orders', 'sb.order-refunds')).toBeTruthy();
    // sb.products emits no POPUP anymore — Phase 4 (backend-driven-completion)
    // converted sb.quantities to a GOTO, so nothing registers under that key.
    expect(getActionPopup('sb.products', 'sb.quantities')).toBeNull();
  });

  it('resolves registered components and returns null for unknown keys', () => {
    clearActionPopups();

    const Dummy = () => null;
    registerActionPopup('sb.test', 'dummy', Dummy);
    expect(getActionPopup('sb.test', 'dummy')).toBe(Dummy);
    expect(getActionPopup('sb.test', 'missing')).toBeNull();

    clearActionPopups();
    expect(getActionPopup('sb.test', 'dummy')).toBeNull();
  });
});

describe('popup-dialog', () => {
  it('renders the title and children when open', () => {
    render(
      <PopupDialog open onOpenChange={() => {}} title="Refund Receipt" description="Print the refund receipt">
        <p data-testid="popup-body">receipt content</p>
      </PopupDialog>,
    );

    expect(screen.getByText('Refund Receipt')).toBeTruthy();
    expect(screen.getByText('Print the refund receipt')).toBeTruthy();
    expect(screen.getByTestId('popup-body').textContent).toBe('receipt content');
  });

  it('renders nothing when closed', () => {
    render(
      <PopupDialog open={false} onOpenChange={() => {}} title="Refund Receipt">
        <p data-testid="popup-body">receipt content</p>
      </PopupDialog>,
    );

    expect(screen.queryByTestId('popup-body')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T2.7 — useBulkActions
// ---------------------------------------------------------------------------

describe('useBulkActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setup(
    overrides: Partial<CrudTableConfig> = {},
    requestConfirm: (request: { title: string; message?: string; destructive: boolean }) => Promise<boolean> = async () => true,
  ) {
    const refresh = vi.fn();
    const { result } = renderHook(() => useBulkActions({ config: makeTableConfig(overrides), requestConfirm, refresh }));
    return { result, refresh };
  }

  it('maps backend bulk actions into the toolbar shape', () => {
    const { result } = setup();

    expect(result.current.bulkActions).toEqual([{ label: 'Delete Selected', action: expect.any(Function) }]);
  });

  it('posts { action, entries } and refreshes on success', async () => {
    (crudApi.bulkActions as Mock).mockResolvedValue({ success: 1, error: 0 });
    const { result, refresh } = setup();

    await act(async () => {
      await result.current.bulkActions[0].action([makeRow()]);
    });

    expect(crudApi.bulkActions).toHaveBeenCalledWith('sb.orders', { action: 'delete_selected', entries: [7] });
    expect(toast.success).toHaveBeenCalledWith('Successfully processed selected items');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('toasts the JSON message when the backend returns one', async () => {
    (crudApi.bulkActions as Mock).mockResolvedValue({ message: 'Deleted 2 entries.' });
    const { result } = setup();

    await act(async () => {
      await result.current.bulkActions[0].action([makeRow(), makeRow({ id: 8, $id: 8 })]);
    });

    expect(toast.success).toHaveBeenCalledWith('Deleted 2 entries.');
  });

  it('opens the shared confirm when the backend definition carries one', async () => {
    (crudApi.bulkActions as Mock).mockResolvedValue({});
    const requestConfirm = vi.fn(async () => true);
    const { result } = setup(
      {
        bulkActions: [{ label: 'Delete Selected', identifier: 'delete_selected', confirm: { message: 'Delete the selected orders ?' } }],
      },
      requestConfirm,
    );

    await act(async () => {
      await result.current.bulkActions[0].action([makeRow()]);
    });

    expect(requestConfirm).toHaveBeenCalledWith({
      title: 'Confirm Your Action',
      message: 'Delete the selected orders ?',
      destructive: true,
    });
    expect(crudApi.bulkActions).toHaveBeenCalledWith('sb.orders', { action: 'delete_selected', entries: [7] });
  });

  it('skips the request when the confirm is declined', async () => {
    const requestConfirm = vi.fn(async () => false);
    const { result, refresh } = setup(
      {
        bulkActions: [{ label: 'Delete Selected', identifier: 'delete_selected', confirm: { message: 'Delete the selected orders ?' } }],
      },
      requestConfirm,
    );

    await act(async () => {
      await result.current.bulkActions[0].action([makeRow()]);
    });

    expect(crudApi.bulkActions).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('guards an empty selection with an info toast', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.bulkActions[0].action([]);
    });

    expect(toast.info).toHaveBeenCalledWith('You need to select at least one item to delete');
    expect(crudApi.bulkActions).not.toHaveBeenCalled();
  });

  it('surfaces errors as error toasts', async () => {
    (crudApi.bulkActions as Mock).mockRejectedValue({ response: { data: { message: 'You are not allowed to do this operation' } } });
    const { result } = setup();

    await act(async () => {
      await result.current.bulkActions[0].action([makeRow()]);
    });

    expect(toast.error).toHaveBeenCalledWith('You are not allowed to do this operation');
  });
});

// ---------------------------------------------------------------------------
// T2.8 — crud-table-page helpers
// ---------------------------------------------------------------------------

describe('crud-table-page helpers', () => {
  it('builds toolbar columns from every supported filter type', () => {
    const config = makeTableConfig({
      queryFilters: [
        { name: 'payment_status', label: 'Payment Status', type: 'select', options: [{ label: 'Paid', value: 'paid' }] },
        { name: 'subul_orders.created_at', label: 'Created Between', type: 'daterangepicker' },
        { name: 'phone', label: 'Customer Phone', type: 'text', operator: 'like' },
      ],
    });

    expect(buildFilterableColumns(config, t)).toEqual([
      { id: 'payment_status', title: 'Payment Status', type: 'select', options: [{ label: 'Paid', value: 'paid' }] },
      { id: 'subul_orders.created_at', title: 'Created Between', type: 'daterangepicker', options: undefined },
      { id: 'phone', title: 'Customer Phone', type: 'text', options: undefined },
    ]);
  });

  it('translates resolved filter state to the backend queryFilters contract', () => {
    const config = makeTableConfig({
      queryFilters: [
        { name: 'payment_status', label: 'Payment Status', type: 'select', options: [] },
        { name: 'subul_orders.created_at', label: 'Created Between', type: 'daterangepicker' },
        { name: 'phone', label: 'Customer Phone', type: 'text', operator: 'like' },
      ],
    });

    expect(
      filterStateToQueryFilters(
        [
          { id: 'payment_status', value: ['paid', 'hold'] },
          { id: 'subul_orders.created_at', value: { from: new Date(2026, 0, 1), to: new Date(2026, 1, 1) } },
          { id: 'phone', value: '  555-0100  ' },
        ],
        config,
      ),
    ).toEqual({
      payment_status: ['paid', 'hold'],
      'subul_orders.created_at': { startDate: '2026-01-01', endDate: '2026-02-01' },
      phone: '555-0100',
    });
  });

  it('skips incomplete date ranges and blank text filters', () => {
    const config = makeTableConfig({
      queryFilters: [
        { name: 'subul_orders.created_at', label: 'Created Between', type: 'daterangepicker' },
        { name: 'phone', label: 'Customer Phone', type: 'text', operator: 'like' },
      ],
    });

    expect(
      filterStateToQueryFilters(
        [
          { id: 'subul_orders.created_at', value: { from: new Date(2026, 0, 1) } },
          { id: 'phone', value: '   ' },
        ],
        config,
      ),
    ).toEqual({});
  });

  it('resolves the Add-New link from config.links (never hardcoded)', () => {
    const config = makeTableConfig();
    const link = getCreateLink(config);

    expect(link?.href).toBe('http://localhost/dashboard/orders/create');
    expect(getCreateLink(makeTableConfig({ links: [] }))).toBeUndefined();
  });

  it('wires no-op filterFns and adds hidden filter-only columns', () => {
    const config = makeTableConfig({
      queryFilters: [
        { name: 'total', label: 'Total', type: 'select', options: [] },
        { name: 'subul_orders.author', label: 'Author', type: 'select', options: [] },
      ],
    });

    const { columns, visibility } = wireQueryFilterColumns(buildCrudColumns({ config: makeTableConfig(), t }), config);

    const total = columns.find((column) => column.id === 'total');
    expect(total && 'filterFn' in total).toBe(true);

    const author = columns.find((column) => column.id === 'subul_orders.author');
    expect(author).toBeTruthy();
    expect(visibility['subul_orders.author']).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T2.8 — CrudTablePage smoke
// ---------------------------------------------------------------------------

describe('crud-table-page (smoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (crudApi.list as Mock).mockResolvedValue(makePaginator());
  });

  it('renders the fixture config with rows, $cssClass and a sortable header', async () => {
    (crudApi.list as Mock).mockResolvedValue({ ...makePaginator(), data: [makeRow({ $cssClass: 'success border text-sm' })] });

    render(<CrudTablePage namespace="sb.orders" initialConfig={makeTableConfig()} />);

    await waitFor(() => expect(screen.getByText('ORD-0007')).toBeTruthy());

    expect(screen.getAllByText('Orders List').length).toBeGreaterThan(0);
    expect((crudApi.list as Mock).mock.calls[0][0]).toBe('sb.orders');
    expect((crudApi.list as Mock).mock.calls[0][1]).toMatchObject({ page: 1, per_page: 20 });

    // `$cssClass` lands on the row (status colors).
    const row = screen.getByText('ORD-0007').closest('tr');
    expect(row?.className).toContain('success border text-sm');

    // Server-side sortable headers come from the backend $sort flags.
    expect(screen.getByRole('button', { name: 'Code' })).toBeTruthy();
  });

  it('renders the retry banner when the entries fetch fails', async () => {
    (crudApi.list as Mock).mockRejectedValue({ response: { data: { message: 'Not allowed.' } } });

    render(<CrudTablePage namespace="sb.orders" initialConfig={makeTableConfig()} />);

    await waitFor(() => expect(screen.getByText('Not allowed.')).toBeTruthy());
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});
