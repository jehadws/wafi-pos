/**
 * crud-table-engine.test.tsx
 *
 * Consolidated vitest coverage for the backend-driven table engine
 * (`components/tables/crud-table/`) — Plan T2.9, grown per micro-step:
 *
 *  - T2.3 columns-builder: column order, sorting flags, date convention,
 *    empty-value rendering, header sort wiring.
 *  - T2.4 row-actions-menu: renders only the backend actions, exactly one
 *    Copy ID, destructive styling for DELETE.
 *  - T2.5 use-action-executor: semantics per action type (confirm gates,
 *    GOTO URL normalization, JSON-vs-HTML toast semantics, refresh).
 *  - T2.6 popup registry: registered components resolve, unknown keys fall
 *    back to navigation.
 *
 * Fixtures mirror the real backend shapes pinned by
 * `tests/Feature/CrudTableConfigContractTest.php` and
 * `tests/Feature/CrudEntryActionsContractTest.php`.
 */

import { buildCrudColumns, crudCellValue, isDateishKey, nextSortDirection } from '@/components/tables/crud-table/columns-builder';
import { RowActionsMenu } from '@/components/tables/crud-table/row-actions-menu';
import type { CrudEntryRow, CrudRowAction, CrudTableConfig } from '@/types/tables';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('@/utils/format', () => ({
  formatDateTime: (value: string) => `DT(${value})`,
}));

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
