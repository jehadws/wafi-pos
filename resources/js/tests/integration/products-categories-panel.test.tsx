/**
 * tests/integration/products-categories-panel.test.tsx
 *
 * Regression tests for the product-click race condition: rapid clicks on
 * product tiles used to be silently dropped by the `isSelectingUnit` state
 * guard. The sequential task queue now honors every click (quick-add mode)
 * and drops only extra clicks while the unit-picker dialog is pending
 * (dialog mode).
 */
import { categoriesApi, productsApi } from '@/api';
import ProductsCategoriesPanel from '@/components/pos/products-categories-panel';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { usePOS } from '@/hooks/usePOS';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/utils/sound', () => ({
  playSound: vi.fn(),
}));

vi.mock('@/components/feedback/empty-state', () => ({
  default: () => null,
}));

// Stub the unit-picker dialog: its open state is driven by the store, which
// is what the dialog-mode assertions observe.
vi.mock('@/components/pos/select-unit-quantity-dialog', () => ({
  default: () => null,
}));

vi.mock('@/api', () => ({
  categoriesApi: { getPosContent: vi.fn() },
  productsApi: { getUnitQuantities: vi.fn() },
  taxesApi: { getGroup: vi.fn() },
}));

const product = {
  id: 1,
  name: 'Rapid Product',
  unit_quantities: [
    {
      id: 11,
      quantity: 10,
      sale_price: 10,
      type: 'piece',
      unit: { id: 3, name: 'pcs' },
    },
  ],
} as any;

describe('components/pos/products-categories-panel click handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePOS.getState().reset();
    usePOS.getState().setAutoMerge(false);
    usePOS.setState({ options: { [POS_OPTION_KEYS.showQuantity]: 'no' } } as any);

    vi.mocked(categoriesApi.getPosContent).mockResolvedValue({
      categories: [],
      products: [product],
      currentCategory: null,
    } as any);
  });

  it('adds every product on rapid clicks from the preloaded payload — none silently dropped (quick-add mode)', async () => {
    render(<ProductsCategoriesPanel />);
    const tile = await screen.findByAltText('Rapid Product');
    expect(productsApi.getUnitQuantities).not.toHaveBeenCalled();

    // 7 rapid clicks — the exact scenario from the bug report. Units are
    // resolved from the category payload (unit_quantities), so the queue
    // drains instantly and every click is honored without a round-trip.
    for (let i = 0; i < 7; i++) {
      fireEvent.click(tile);
    }

    await waitFor(() => expect(usePOS.getState().products).toHaveLength(7));
    expect(productsApi.getUnitQuantities).not.toHaveBeenCalled();
    expect(usePOS.getState().products.every((p) => p.quantity === 1)).toBe(true);
    expect(usePOS.getState().products.every((p) => p.unit_quantity_id === 11)).toBe(true);
  });

  it('filters invisible units from the preloaded payload — mirrors the units API visible() scope', async () => {
    vi.mocked(categoriesApi.getPosContent).mockResolvedValue({
      categories: [],
      products: [
        {
          id: 3,
          name: 'Multi Unit Product',
          unit_quantities: [
            { id: 31, quantity: 5, sale_price: 10, type: 'piece', unit: { id: 3, name: 'pcs' } },
            { id: 32, quantity: 9, sale_price: 90, type: 'box', visible: 0, unit: { id: 4, name: 'box' } },
          ],
        } as any,
      ],
      currentCategory: null,
    } as any);

    render(<ProductsCategoriesPanel />);
    const tile = await screen.findByAltText('Multi Unit Product');

    // Two preloaded units → after filtering the hidden box away only the
    // visible piece remains, so quick-add resolves it inline (no dialog,
    // no API call) exactly like the units API response would have.
    fireEvent.click(tile);

    await waitFor(() => expect(usePOS.getState().products).toHaveLength(1));
    expect(usePOS.getState().products[0].unit_quantity_id).toBe(31);
    expect(productsApi.getUnitQuantities).not.toHaveBeenCalled();
    expect(usePOS.getState().openDialogs['selectQuantity']).toBeFalsy();
  });

  it('respects Show Quantity = yes — unit picker first, then the quantity keypad; never a direct qty-1 add', async () => {
    usePOS.setState({ options: { [POS_OPTION_KEYS.showQuantity]: 'yes' } } as any);

    render(<ProductsCategoriesPanel />);
    const tile = await screen.findByAltText('Rapid Product');

    fireEvent.click(tile);

    // The unit picker opens (fed from the preloaded payload — no API
    // call)… and a click alone must never reach the cart.
    await waitFor(() => expect(usePOS.getState().openDialogs['selectQuantity']).toBe(true));
    expect(usePOS.getState().products).toHaveLength(0);
    expect(productsApi.getUnitQuantities).not.toHaveBeenCalled();

    // The cashier picks the unit in the picker…
    await act(async () => {
      usePOS.getState().closeDialog('selectQuantity', product.unit_quantities[0]);
    });

    // …and the QUANTITY KEYPAD opens: the line only lands in the cart
    // after a quantity is confirmed. A direct qty-1 add here would
    // violate the setting.
    await screen.findByText('Define Quantity');
    expect(usePOS.getState().products).toHaveLength(0);
  });

  it('ignores extra clicks while the unit-picker dialog is pending (dialog mode)', async () => {
    usePOS.setState({ options: { [POS_OPTION_KEYS.showQuantity]: 'yes' } } as any);

    render(<ProductsCategoriesPanel />);
    const tile = await screen.findByAltText('Rapid Product');

    // First click opens the unit-picker and waits for the user.
    fireEvent.click(tile);
    await waitFor(() => expect(usePOS.getState().openDialogs['selectQuantity']).toBe(true));
    const firstResolver = usePOS.getState().resolvers['selectQuantity'];
    expect(typeof firstResolver).toBe('function');

    // Extra clicks must be ignored — a second openDialog would otherwise
    // clobber the pending resolver and strand the first promise forever.
    fireEvent.click(tile);
    fireEvent.click(tile);
    expect(usePOS.getState().resolvers['selectQuantity']).toBe(firstResolver);
    expect(usePOS.getState().products).toHaveLength(0);

    // Dismiss the picker: the promise settles with null, nothing is added.
    await act(async () => {
      usePOS.getState().closeDialog('selectQuantity', null);
    });
    expect(usePOS.getState().products).toHaveLength(0);
  });

  it('renders the display-setting price on the tile — not the with-tax sale_price alias', async () => {
    usePOS.setState({
      options: {
        [POS_OPTION_KEYS.showQuantity]: 'yes',
        sb_subul_price_with_tax: 'no',
        sb_subul_vat: 'products_vat',
      },
    } as any);

    vi.mocked(categoriesApi.getPosContent).mockResolvedValue({
      categories: [],
      products: [
        {
          id: 2,
          name: 'Priced Product',
          unit_quantities: [
            {
              id: 21,
              quantity: 5,
              sale_price: 100.282, // backend alias — always with-tax
              sale_price_edit: 86.45,
              sale_price_without_tax: 86.45,
              sale_price_with_tax: 100.282,
              type: 'piece',
              unit: { id: 3, name: 'pcs' },
            },
          ],
        } as any,
      ],
      currentCategory: null,
    } as any);

    render(<ProductsCategoriesPanel />);
    await screen.findByAltText('Priced Product');

    // "Show Price With Tax: no" → the tile must show the without-tax price
    // (the same amount the cart charges), never the sale_price alias.
    expect(screen.getByText('$86.45')).toBeTruthy();
    expect(screen.queryByText('$100.28')).toBeNull();
  });
});
