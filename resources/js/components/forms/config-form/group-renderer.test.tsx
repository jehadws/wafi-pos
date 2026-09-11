/**
 * group-renderer.test.tsx
 *
 * Unit tests for GroupRenderer.
 * Covers: initial row rendering, adding rows, removing rows, nested value
 * emission, and disabled state.
 */
import type { GroupFieldDef } from '@/types/forms';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GroupRenderer } from './group-renderer';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Stub heavy UI deps so tests stay focused on GroupRenderer logic.
vi.mock('./field-renderer', () => ({
  FieldRenderer: ({
    field,
    value,
    onChange,
    id,
  }: {
    field: { name?: string; label?: string };
    value: unknown;
    onChange: (v: unknown) => void;
    id?: string;
  }) => (
    <input
      data-testid={id ?? field.name}
      aria-label={field.label ?? field.name}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const groupField: GroupFieldDef = {
  name: 'units',
  type: 'group',
  label: 'Units',
  fields: [
    { name: 'unit_name', label: 'Unit Name', type: 'text', value: '' },
    { name: 'quantity', label: 'Quantity', type: 'number', value: '' },
  ],
  closable: true,
};

describe('GroupRenderer', () => {
  // ------------------------------------------------------------------
  // Rendering pre-filled rows
  // ------------------------------------------------------------------
  it('renders one row per entry in the value array', () => {
    const rows = [
      { unit_name: 'Kg', quantity: '1' },
      { unit_name: 'g', quantity: '1000' },
    ];
    render(<GroupRenderer field={groupField} value={rows} onChange={vi.fn()} />);
    expect(screen.getByTestId('group-units-0-unit_name')).toBeTruthy();
    expect(screen.getByTestId('group-units-1-unit_name')).toBeTruthy();
  });

  it('renders no rows when value is empty', () => {
    render(<GroupRenderer field={groupField} value={[]} onChange={vi.fn()} />);
    expect(screen.queryByTestId('group-row-0')).toBeNull();
  });

  // ------------------------------------------------------------------
  // Add row
  // ------------------------------------------------------------------
  it('calls onChange with a new default row appended when Add row is clicked', () => {
    const onChange = vi.fn();
    render(<GroupRenderer field={groupField} value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }));
    expect(onChange).toHaveBeenCalledWith([{ unit_name: '', quantity: '' }]);
  });

  it('appends to existing rows', () => {
    const onChange = vi.fn();
    const rows = [{ unit_name: 'Kg', quantity: '1' }];
    render(<GroupRenderer field={groupField} value={rows} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }));
    expect(onChange).toHaveBeenCalledWith([
      { unit_name: 'Kg', quantity: '1' },
      { unit_name: '', quantity: '' },
    ]);
  });

  // ------------------------------------------------------------------
  // Remove row
  // ------------------------------------------------------------------
  it('removes the correct row when Remove is clicked', () => {
    const onChange = vi.fn();
    const rows = [
      { unit_name: 'Kg', quantity: '1' },
      { unit_name: 'g', quantity: '1000' },
    ];
    render(<GroupRenderer field={groupField} value={rows} onChange={onChange} />);
    const removeButtons = screen.getAllByRole('button', { name: 'Remove row' });
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith([{ unit_name: 'g', quantity: '1000' }]);
  });

  // ------------------------------------------------------------------
  // Value emission from nested fields
  // ------------------------------------------------------------------
  it('emits updated rows when a nested field changes', () => {
    const onChange = vi.fn();
    const rows = [{ unit_name: 'Kg', quantity: '1' }];
    render(<GroupRenderer field={groupField} value={rows} onChange={onChange} />);

    const nameInput = screen.getByTestId('group-units-0-unit_name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Pound' } });

    expect(onChange).toHaveBeenCalledWith([{ unit_name: 'Pound', quantity: '1' }]);
  });

  // ------------------------------------------------------------------
  // Disabled state
  // ------------------------------------------------------------------
  it('hides Add row and Remove row buttons when disabled', () => {
    const rows = [{ unit_name: 'Kg', quantity: '1' }];
    render(<GroupRenderer field={groupField} value={rows} onChange={vi.fn()} disabled />);
    expect(screen.queryByRole('button', { name: 'Add row' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove row' })).toBeNull();
  });
});
