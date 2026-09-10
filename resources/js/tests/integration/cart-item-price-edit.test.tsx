/**
 * tests/integration/cart-item-price-edit.test.tsx
 *
 * "Editable Unit Price" (sb_subul_unit_price_ediable) gates the cart line's
 * price control. When the option is off the price renders as plain text and
 * no price keypad can be opened — neither the centralized one in CartTable
 * (onOpenPriceKeypad) nor the local fallback in CartItem. The discount link
 * is a separate control and must stay interactive in both states.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CartItem from '@/components/pos/cart-item';
import CartTable from '@/components/pos/cart-table';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { usePOS } from '@/hooks/usePOS';

// radix ScrollArea (used by CartTable) needs ResizeObserver, which jsdom
// does not implement.
class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}
(globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver ?? ResizeObserverMock;

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

const item = {
    _uuid: 'u1',
    id: 1,
    name: 'Cart Product',
    product_id: 1,
    unit_id: 3,
    unit_name: 'pcs',
    quantity: 1,
    unit_price: 10,
    price_without_tax: 10,
    price_with_tax: 10,
    total_price_without_tax: 10,
    total_price_with_tax: 10,
    discount: 0,
    discount_percentage: 0,
    mode: 'normal',
} as any;

const renderCartItem = (props: Record<string, unknown> = {}) =>
    render(
        <CartItem
            item={item}
            removeFromCart={vi.fn()}
            updateQuantity={vi.fn()}
            updatePrice={vi.fn()}
            updateDiscountPercentage={vi.fn()}
            {...props}
        />,
    );

const renderCartTable = (props: Record<string, unknown> = {}) =>
    render(
        <CartTable
            cart={[item]}
            removeFromCart={vi.fn()}
            updateQuantity={vi.fn()}
            updatePrice={vi.fn()}
            updateDiscountPercentage={vi.fn()}
            clearCart={vi.fn()}
            removeSelectedItems={vi.fn()}
            selectedItems={[]}
            toggleItemSelection={vi.fn()}
            selectAllItems={vi.fn()}
            deselectAllItems={vi.fn()}
            {...props}
        />,
    );

describe('components/pos/cart-item price edit gate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        usePOS.getState().reset();
    });

    it('opens the centralized price keypad when unit-price editing is allowed', () => {
        usePOS.setState({ options: { [POS_OPTION_KEYS.unitPriceEditable]: 'yes' } } as any);
        const onOpenPriceKeypad = vi.fn();

        renderCartItem({ onOpenPriceKeypad });

        fireEvent.click(screen.getByRole('button', { name: /^Price:/ }));
        expect(onOpenPriceKeypad).toHaveBeenCalledWith(item);
    });

    it('opens the fallback price keypad when no centralized handler is provided', async () => {
        usePOS.setState({ options: { [POS_OPTION_KEYS.unitPriceEditable]: 'yes' } } as any);

        renderCartItem();

        fireEvent.click(screen.getByRole('button', { name: /^Price:/ }));
        expect(await screen.findByText('Product Price')).toBeTruthy();
    });

    it('renders the price as inert text when unit-price editing is disabled', () => {
        usePOS.setState({ options: { [POS_OPTION_KEYS.unitPriceEditable]: 'no' } } as any);
        const onOpenPriceKeypad = vi.fn();

        const { container } = renderCartItem({ onOpenPriceKeypad });

        expect(screen.queryByRole('button', { name: /^Price:/ })).toBeNull();
        expect(container.textContent).toContain('Price:');
        expect(container.textContent).toContain('10.00');
        // The discount link is a separate option and stays interactive.
        expect(screen.getByRole('button', { name: /^Discount/ })).toBeTruthy();
        expect(onOpenPriceKeypad).not.toHaveBeenCalled();
    });

    it('keeps the discount link clickable while price editing is disabled', () => {
        usePOS.setState({ options: { [POS_OPTION_KEYS.unitPriceEditable]: 'no' } } as any);
        const onOpenDiscountKeypad = vi.fn();

        renderCartItem({ onOpenDiscountKeypad });

        fireEvent.click(screen.getByRole('button', { name: /^Discount/ }));
        expect(onOpenDiscountKeypad).toHaveBeenCalledWith(item);
    });
});

describe('components/pos/cart-table centralized price keypad', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        usePOS.getState().reset();
    });

    it('opens and applies a price edit when unit-price editing is allowed', () => {
        usePOS.setState({ options: { [POS_OPTION_KEYS.unitPriceEditable]: 'yes' } } as any);
        const updatePrice = vi.fn();

        renderCartTable({ updatePrice });

        fireEvent.click(screen.getByRole('button', { name: /^Price:/ }));
        // The keypad pre-fills with the line's current price ("10") — typing
        // the shown price is a no-op. Clear it, then enter 12.
        fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
        fireEvent.click(screen.getByRole('button', { name: '1' }));
        fireEvent.click(screen.getByRole('button', { name: '2' }));
        fireEvent.click(screen.getByRole('button', { name: 'Enter' }));

        expect(updatePrice).toHaveBeenCalledWith(item, 12);
    });

    it('never opens the price keypad when unit-price editing is disabled', () => {
        usePOS.setState({ options: { [POS_OPTION_KEYS.unitPriceEditable]: 'no' } } as any);
        const updatePrice = vi.fn();

        renderCartTable({ updatePrice });

        expect(screen.queryByRole('button', { name: /^Price:/ })).toBeNull();
        expect(screen.queryByText('Item Price')).toBeNull();
        expect(updatePrice).not.toHaveBeenCalled();
    });
});
