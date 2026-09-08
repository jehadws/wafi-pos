/**
 * tests/integration/products-categories-panel.test.tsx
 *
 * Regression tests for the product-click race condition: rapid clicks on
 * product tiles used to be silently dropped by the `isSelectingUnit` state
 * guard. The sequential task queue now honors every click (quick-add mode)
 * and drops only extra clicks while the unit-picker dialog is pending
 * (dialog mode).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProductsCategoriesPanel from '@/components/pos/products-categories-panel';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { usePOS } from '@/hooks/usePOS';
import { categoriesApi, productsApi } from '@/api';

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

const unitQuantity = product.unit_quantities[0];

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

    it('adds every product on rapid clicks — none silently dropped (quick-add mode)', async () => {
        // Each lookup hangs until the test resolves it, so serialization is
        // observable: the next lookup must not fire before the previous one
        // has been resolved.
        const pending: Array<(units: any[]) => void> = [];
        vi.mocked(productsApi.getUnitQuantities).mockImplementation(
            () =>
                new Promise((resolve) => {
                    pending.push(resolve);
                }),
        );

        render(<ProductsCategoriesPanel />);
        const tile = await screen.findByAltText('Rapid Product');
        expect(productsApi.getUnitQuantities).not.toHaveBeenCalled();

        // 7 rapid clicks — the exact scenario from the bug report.
        for (let i = 0; i < 7; i++) {
            fireEvent.click(tile);
        }

        // While the first lookup is in flight nothing else may fire: the
        // remaining clicks are buffered, not dropped, not run concurrently.
        expect(productsApi.getUnitQuantities).toHaveBeenCalledTimes(1);

        for (let i = 0; i < 7; i++) {
            await waitFor(() =>
                expect(productsApi.getUnitQuantities).toHaveBeenCalledTimes(i + 1),
            );
            await act(async () => {
                pending[i]([unitQuantity]);
            });
        }

        await waitFor(() => expect(usePOS.getState().products).toHaveLength(7));
        expect(productsApi.getUnitQuantities).toHaveBeenCalledTimes(7);
        expect(usePOS.getState().products.every((p) => p.quantity === 1)).toBe(true);
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