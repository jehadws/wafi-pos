/**
 * data-table-toolbar.test.tsx
 *
 * Regression coverage for the toolbar's bulk-actions bar (`ui/data-table`):
 * the "Bulk Actions" select + Apply stay rendered whenever the table defines
 * bulk actions, disabled until at least one row is checked; Apply hands the
 * selected rows to the action and clears the selection.
 */

import { DataTable } from '@/components/ui/data-table/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Stub Radix Select (same spirit as field-renderer.test.tsx — jsdom has no
// pointer-capture), plus a tiny context so items can report onValueChange
// and the trigger forwards its disabled state.
vi.mock('@/components/ui/select', async () => {
  const React = await import('react');
  const SelectContext = React.createContext<(value: string) => void>(() => {});

  return {
    Select: ({
      onValueChange,
      children,
    }: {
      onValueChange?: (value: string) => void;
      children: React.ReactNode;
    }) => (
      <SelectContext.Provider value={(value: string) => onValueChange?.(value)}>{children}</SelectContext.Provider>
    ),
    SelectTrigger: ({ children, ...props }: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => {
      const onValueChange = React.useContext(SelectContext);
      return (
        <div role="option" data-value={value} onClick={() => onValueChange(value)}>
          {children}
        </div>
      );
    },
  };
});

interface Row {
  id: number;
  name: string;
}

const rows: Row[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
];

const columns: ColumnDef<Row, unknown>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label={`Select row ${row.original.id}`}
        checked={row.getIsSelected()}
        onChange={(event) => row.toggleSelected(event.target.checked)}
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
];

/** The bulk-actions Select trigger — located by its "Bulk Actions" label. */
function getBulkTrigger(): HTMLButtonElement {
  const label = screen.getByText('Bulk Actions');
  const trigger = label.closest('button');
  expect(trigger).toBeInstanceOf(HTMLButtonElement);
  return trigger as HTMLButtonElement;
}

/** The toolbar's "Apply" button. */
function getApplyButton(): HTMLButtonElement {
  const button = screen.getByRole('button', { name: 'Apply' });
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

describe('data-table toolbar — bulk actions', () => {
  it('renders the bar disabled while nothing is selected', () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        bulkActions={[{ label: 'Delete Selected', action: vi.fn() }]}
      />,
    );

    expect(getBulkTrigger().disabled).toBe(true);
    expect(getApplyButton().disabled).toBe(true);
  });

  it('does not render the bar when the table defines no bulk actions', () => {
    render(<DataTable columns={columns} data={rows} />);

    expect(screen.queryByText('Bulk Actions')).toBeNull();
  });

  it('enables once rows are selected and Apply receives them, then clears', async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={rows}
        bulkActions={[{ label: 'Delete Selected', action }]}
      />,
    );

    // Select everything via the header checkbox.
    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));

    expect(getBulkTrigger().disabled).toBe(false);
    expect(getApplyButton().disabled).toBe(true);

    // Pick the action (the stub keeps options in the DOM — no open step).
    await user.click(screen.getByRole('option', { name: 'Delete Selected' }));
    expect(getApplyButton().disabled).toBe(false);

    await user.click(getApplyButton());

    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith(rows);
    // The selection is cleared after running — the bar disables again.
    expect(getBulkTrigger().disabled).toBe(true);
    expect(getApplyButton().disabled).toBe(true);
  });
});
