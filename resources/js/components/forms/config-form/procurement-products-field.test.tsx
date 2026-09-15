/**
 * procurement-products-field.test.tsx
 *
 * Unit coverage for the `procurementProducts` root custom section (Phase 2
 * of `docs/plans/backend-driven-completion`): renders seeded rows,
 * add-via-search dedupes with a toast, remove works, the unit/tax/convert
 * modals open and write back through `onChange`, row edits mark `$invalid`
 * for zero/negative quantity and missing unit, and emitted values carry
 * `_key` (stripped at submit by `buildCrudPayload`).
 */
import { procurementsApi } from '@/api';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ProcurementProductsField } from './procurement-products-field';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/api', () => ({
  procurementsApi: {
    searchProduct: vi.fn(),
    getUnitGroupUnits: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

import { toast } from 'sonner';

// cmdk (search popover) + radix Select need these stubs in jsdom.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
if (typeof Element !== 'undefined') {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.releasePointerCapture = () => {};
  }
}

const taxGroups = [{ id: 3, name: 'VAT 10%', taxes: [{ id: 1, rate: 10 }] }];

const baseRow = {
  _key: 'row-1',
  product_id: 5,
  name: 'Flour',
  purchase_price: 10,
  quantity: 2,
  unit_id: 11,
  unit_group: 2,
  unit_quantities: [
    { unit_id: 11, unit: { name: 'kg' } },
    { unit_id: 12, unit: { name: 'g' } },
  ],
  total_purchase_price: 20,
  tax_value: 0,
};

const renderField = ({ value, onChange }: { value?: unknown; onChange?: (v: unknown) => void } = {}) =>
  render(
    <ProcurementProductsField
      field={{ name: 'products', label: 'products', type: 'custom', props: { taxGroups } }}
      value={value ?? []}
      onChange={onChange ?? vi.fn()}
    />,
  );

/** The cmdk item element of the search result carrying `label`. */
function searchItem(label: string): HTMLElement {
  const items = screen
    .getAllByText(label)
    .map((node) => node.closest('[data-slot="command-item"]'))
    .filter((item): item is HTMLElement => item !== null);
  expect(items.length).toBeGreaterThan(0);
  return items[0];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProcurementProductsField', () => {
  it('renders seeded rows with their inputs and empty state', () => {
    renderField({ value: [baseRow] });
    expect(screen.getByText('Flour')).toBeTruthy();
    expect(screen.getByDisplayValue('10')).toBeTruthy();
    expect(screen.getByDisplayValue('2')).toBeTruthy();
  });

  it('shows the empty state when there are no rows', () => {
    renderField();
    expect(screen.getByText('No products added yet. Use the search bar above to add products to this procurement.')).toBeTruthy();
  });

  it('adds a product through search and emits a normalized row with _key', async () => {
    const onChange = vi.fn();
    (procurementsApi.searchProduct as Mock).mockResolvedValue([
      { id: 9, name: 'Sugar', unit_group: 2, unit_quantities: [{ unit_id: 11, unit: { name: 'kg' } }] },
    ]);
    const user = userEvent.setup();

    renderField({ value: [], onChange });

    // The DropdownSearch trigger carries role="combobox" (no accessible
    // name — combobox is not name-from-content) and is the only combobox
    // while no modal is open.
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('SKU, Barcode, Product name.'), 'sug');

    await waitFor(() => expect(procurementsApi.searchProduct).toHaveBeenCalledWith('sug'));
    await user.click(searchItem('Sugar'));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const rows = onChange.mock.calls[0][0] as Array<Record<string, any>>;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ product_id: 9, name: 'Sugar', quantity: 1, unit_id: 11, $invalid: false });
    expect(rows[0]._key).toEqual(expect.any(String));
  });

  it('dedupes a product that is already added with a warning toast', async () => {
    const onChange = vi.fn();
    (procurementsApi.searchProduct as Mock).mockResolvedValue([{ id: 5, name: 'Flour', unit_quantities: [] }]);
    const user = userEvent.setup();

    renderField({ value: [baseRow], onChange });

    // The DropdownSearch trigger carries role="combobox" (no accessible
    // name — combobox is not name-from-content) and is the only combobox
    // while no modal is open.
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('SKU, Barcode, Product name.'), 'flour');
    await user.click(searchItem('Flour'));

    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith('This product is already added to the procurement.'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes a row through its Delete button', () => {
    const onChange = vi.fn();
    renderField({ value: [baseRow], onChange });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('marks rows $invalid for zero quantity and keeps _key on emitted values', () => {
    const onChange = vi.fn();
    renderField({ value: [baseRow], onChange });

    fireEvent.change(screen.getByDisplayValue('2'), { target: { value: '0' } });

    const rows = onChange.mock.calls[0][0] as Array<Record<string, any>>;
    expect(rows[0].quantity).toBe(0);
    expect(rows[0].$invalid).toBe(true);
    expect(rows[0]._key).toBe('row-1');
  });

  it('marks rows $invalid for negative quantity and missing unit', () => {
    const onChange = vi.fn();
    renderField({ value: [{ ...baseRow, quantity: 2 }, { ...baseRow, _key: 'row-2', product_id: 6, name: 'Salt', unit_id: null, quantity: 1 }], onChange });

    fireEvent.change(screen.getAllByDisplayValue('2')[0], { target: { value: '-1' } });

    const rows = onChange.mock.calls[0][0] as Array<Record<string, any>>;
    expect(rows.find((r) => r._key === 'row-1')?.$invalid).toBe(true);
    expect(rows.find((r) => r._key === 'row-2')?.$invalid).toBe(true);
  });

  it('changes the purchase unit through the unit modal', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderField({ value: [baseRow], onChange });

    await user.click(screen.getByRole('button', { name: 'Unit: kg' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Flour: Purchase Unit')).toBeTruthy();

    await user.click(within(dialog).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'g' }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const rows = onChange.mock.calls[0][0] as Array<Record<string, any>>;
    expect(rows[0].unit_id).toBe(12);
  });

  it('assigns a tax group through the tax modal', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderField({ value: [baseRow], onChange });

    await user.click(screen.getByRole('button', { name: 'Tax: N/A' }));
    const dialog = screen.getByRole('dialog');

    await user.click(within(dialog).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'VAT 10%' }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const rows = onChange.mock.calls[0][0] as Array<Record<string, any>>;
    expect(rows[0].tax_group_id).toBe(3);
    expect(rows[0].tax_rate).toBe(10);
  });

  it('loads convert units and assigns one through the convert modal', async () => {
    (procurementsApi.getUnitGroupUnits as Mock).mockResolvedValue([
      { id: 4, name: 'Box' },
      { id: 11, name: 'kg' },
    ]);
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderField({ value: [baseRow], onChange });

    await user.click(screen.getByRole('button', { name: 'Convert: N/A' }));
    await waitFor(() => expect(procurementsApi.getUnitGroupUnits).toHaveBeenCalledWith(2));

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('combobox'));
    // Units already used by a row are filtered out of the conversion list.
    await user.click(await screen.findByRole('option', { name: 'Box' }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const rows = onChange.mock.calls[0][0] as Array<Record<string, any>>;
    expect(rows[0].convert_unit_id).toBe(4);
    expect(rows[0].convert_unit_label).toBe('Box');
    expect(screen.queryByRole('option', { name: 'kg' })).toBeNull();
  });
});

