import { useCallback, useEffect, useState } from 'react';
import { OrderProduct } from '@/types/models/order-product';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';

export interface UseCartSelectionOptions {
    products: OrderProduct[];
    onBatchRemove: (remainingProducts: OrderProduct[]) => void;
}

export function useCartSelection({ products, onBatchRemove }: UseCartSelectionOptions) {
    const { t } = useTranslation();
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    // Clear selection whenever the products list changes
    useEffect(() => {
        setSelectedItems([]);
    }, [products]);

    const toggleItemSelection = useCallback((productId: string) => {
        setSelectedItems((prev) =>
            prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
        );
    }, []);

    const selectAllItems = useCallback(() => {
        setSelectedItems(products.map((item) => item._uuid || `${item.product_id}-${item.unit_id}`));
    }, [products]);

    const deselectAllItems = useCallback(() => {
        setSelectedItems([]);
    }, []);

    const removeSelectedItems = useCallback(() => {
        if (selectedItems.length === 0) return;

        const idSet = new Set(selectedItems);
        const count = selectedItems.length;
        const remaining = products.filter(
            (p) => !idSet.has(p._uuid || `${p.product_id}-${p.unit_id}`),
        );

        onBatchRemove(remaining);
        setSelectedItems([]);

        toast.success(t('{entries} items removed', { entries: count }), {
            description: t('Selected items have been removed from the cart'),
        });
    }, [selectedItems, products, onBatchRemove, t]);

    return {
        selectedItems,
        toggleItemSelection,
        selectAllItems,
        deselectAllItems,
        removeSelectedItems,
        setSelectedItems,
    };
}
