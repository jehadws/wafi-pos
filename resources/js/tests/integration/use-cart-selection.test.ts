import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartSelection } from '@/hooks/pos/use-cart-selection';
import { OrderProduct } from '@/types/models/order-product';

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: (str: string, params?: Record<string, any>) => {
            if (params?.entries) return `${params.entries} items removed`;
            return str;
        },
    }),
}));

describe('hooks/pos/use-cart-selection', () => {
    const mockProducts: OrderProduct[] = [
        { _uuid: 'item-1', product_id: 1, unit_id: 1, name: 'Item 1' } as any,
        { _uuid: 'item-2', product_id: 2, unit_id: 1, name: 'Item 2' } as any,
        { _uuid: 'item-3', product_id: 3, unit_id: 1, name: 'Item 3' } as any,
    ];

    it('toggles item selection', () => {
        const onBatchRemove = vi.fn();
        const { result } = renderHook(() =>
            useCartSelection({ products: mockProducts, onBatchRemove }),
        );

        act(() => {
            result.current.toggleItemSelection('item-1');
        });
        expect(result.current.selectedItems).toEqual(['item-1']);

        act(() => {
            result.current.toggleItemSelection('item-2');
        });
        expect(result.current.selectedItems).toEqual(['item-1', 'item-2']);

        act(() => {
            result.current.toggleItemSelection('item-1');
        });
        expect(result.current.selectedItems).toEqual(['item-2']);
    });

    it('selects all items and deselects all items', () => {
        const onBatchRemove = vi.fn();
        const { result } = renderHook(() =>
            useCartSelection({ products: mockProducts, onBatchRemove }),
        );

        act(() => {
            result.current.selectAllItems();
        });
        expect(result.current.selectedItems).toEqual(['item-1', 'item-2', 'item-3']);

        act(() => {
            result.current.deselectAllItems();
        });
        expect(result.current.selectedItems).toEqual([]);
    });

    it('performs single-pass batch removal and clears selection', () => {
        const onBatchRemove = vi.fn();
        const { result } = renderHook(() =>
            useCartSelection({ products: mockProducts, onBatchRemove }),
        );

        act(() => {
            result.current.toggleItemSelection('item-1');
            result.current.toggleItemSelection('item-3');
        });

        act(() => {
            result.current.removeSelectedItems();
        });

        expect(onBatchRemove).toHaveBeenCalledTimes(1);
        expect(onBatchRemove).toHaveBeenCalledWith([mockProducts[1]]); // Only item-2 remains
        expect(result.current.selectedItems).toEqual([]);
    });

    it('retains selection when products list updates with surviving items', () => {
        const onBatchRemove = vi.fn();
        let products = [...mockProducts];
        const { result, rerender } = renderHook(() =>
            useCartSelection({ products, onBatchRemove }),
        );

        act(() => {
            result.current.toggleItemSelection('item-2');
        });
        expect(result.current.selectedItems).toEqual(['item-2']);

        // Simulate an item update (e.g. quantity change produces new array reference)
        products = [
            { ...mockProducts[0], quantity: 2 } as any,
            { ...mockProducts[1], quantity: 3 } as any,
        ];
        rerender();

        expect(result.current.selectedItems).toEqual(['item-2']);

        // Simulate complete cart clear
        products = [];
        rerender();

        expect(result.current.selectedItems).toEqual([]);
    });
});
