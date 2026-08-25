/**
 * hooks/pos/use-cart-store.ts
 *
 * Zustand slice — cart products management.
 * Delegates all math to services/order-builder and services/pricing.
 *
 * Extracted from usePOS.ts:
 *   products, autoMerge, processingAddQueue,
 *   addToCart, removeProduct, removeProductUsingIndex,
 *   resumeRemovingProductUsingIndex, updateProduct, clearCart,
 *   setAutoMerge, checkCart, recomputeProducts
 */

import { OrderProduct } from '@/types/models/order-product';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { usersApi } from '@/api';
import { computeItem } from '@/services/cart-engine';
import { playSound } from '@/utils/sound';
import type { POSStore } from './pos-store-types';
import { StateCreator } from 'zustand';
import { toast } from 'sonner';


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// The cart slice reads options + order from the outer merged store.
// We declare only the slice's own fields here; the rest are injected via the
// merged POSStore type in usePOS.ts.

export interface CartSliceState {
    products: OrderProduct[];
    autoMerge: boolean;
    processingAddQueue: boolean;
}

export interface CartSliceActions {
    addToCart: (product: any) => Promise<void>;
    removeProduct: (product: OrderProduct) => void;
    removeProductUsingIndex: (index: number) => Promise<void>;
    resumeRemovingProductUsingIndex: (index: number, products: OrderProduct[]) => void;
    updateProduct: (product: OrderProduct, data: object, index?: number | null) => void;
    clearCart: () => void;
    setAutoMerge: (enabled: boolean) => void;
    checkCart: () => void;
    recomputeProducts: (products?: OrderProduct[] | null) => OrderProduct[];
}

export type CartSlice = CartSliceState & CartSliceActions;

// ---------------------------------------------------------------------------
// Slice factory
// ---------------------------------------------------------------------------

/**
 * createCartSlice requires access to the full merged store so it can call
 * refreshCart, removeCoupon, and read options + order.
 * Pass the merged store type as the generic parameter in usePOS.ts.
 */
export const createCartSlice: StateCreator<POSStore, [], [], CartSlice> = (set, get) => ({
    // Initial state
    products: [],
    autoMerge: false,
    processingAddQueue: false,

    addToCart: async (product) => {
        let cartProduct: OrderProduct = {
            product_id: product.id || product.product_id || 0,
            name: product.name,
            discount_type: product.discount_type || 'percentage',
            discount: product.discount || 0,
            discount_percentage: product.discount_percentage || 0,
            product_type: product.product_type || 'product',
            rate: product.rate || 0,
            quantity: product.quantity || 0,
            tax_group_id: product.tax_group_id,
            tax_type: product.tax_type || undefined,
            tax_value: product.tax_value || 0,
            unit_id: product.unit_id || 0,
            unit_price: product.unit_price || 0,
            price_with_tax: product.price_with_tax || 0,
            price_without_tax: product.price_without_tax || 0,
            unit_name: product.unit_name || '',
            total_price: product.total_price || 0,
            total_price_without_tax: product.total_price_without_tax || 0,
            total_price_with_tax: product.total_price_with_tax || 0,
            total_tax_value: product.total_tax_value || 0,
            mode: product.mode || 'normal',
            order_id: product.order_id || null,
            quantities: product.quantities,
            source: product.source ?? {
                id: product.id || product.product_id || 0,
                category_id: (product as any).category_id,
                tax_type: (product as any).tax_type,
                tax_group: (product as any).tax_group ?? null,
            },
            unit_quantity_id: product.unit_quantity_id || 0,
            _uuid:
                product._uuid ||
                `${product.id || product.product_id}-${product.unit_id}-${Date.now()}`,
        };

        set({ processingAddQueue: true });
        // Future: place addToCartQueue logic here
        set({ processingAddQueue: false });

        const products: OrderProduct[] = get().products;
        let newProducts: OrderProduct[];

        if (get().autoMerge) {
            const existingIndex = products.findIndex(
                (p) =>
                    p.product_id === cartProduct.product_id &&
                    p.tax_group_id === cartProduct.tax_group_id &&
                    p.unit_id === cartProduct.unit_id &&
                    p.unit_quantity_id === cartProduct.unit_quantity_id,
            );

            if (existingIndex >= 0) {
                newProducts = products.map((p, i) =>
                    i === existingIndex
                        ? { ...p, quantity: p.quantity + cartProduct.quantity }
                        : p,
                );
            } else {
                newProducts = [cartProduct, ...products];
            }
        } else {
            newProducts = [cartProduct, ...products];
        }

        const recomputed = get().recomputeProducts(newProducts);
        set({ products: recomputed });
        get().refreshCart();

        const url = get().options?.[POS_OPTION_KEYS.newItemAudio];
        playSound(url);
    },

    removeProduct: (product) => {
        const products: OrderProduct[] = get().products;
        const newProducts = products.filter((p) => p !== product);
        set({ products: newProducts });
        get().refreshCart();
    },

    removeProductUsingIndex: async (index) => {
        const products: OrderProduct[] = get().products;
        const product = products[index];

        if (product.id) {
            try {
                await usersApi.checkPermission('nexopos.pos.delete-order-product');
                get().resumeRemovingProductUsingIndex(index, products);
            } catch {
                toast.error('Forbidden Action', {
                    description: 'You are not allowed to remove this product.',
                });
            }
        } else {
            get().resumeRemovingProductUsingIndex(index, products);
        }
    },

    resumeRemovingProductUsingIndex: (index, products) => {
        const newProducts = products.filter((_, i) => i !== index);
        set({ products: newProducts });
        get().refreshCart();
    },

    updateProduct: (product, data, index = null) => {
        const products: OrderProduct[] = get().products;
        const resolvedIndex = index === null ? products.indexOf(product) : index;
        const finalIndex = resolvedIndex === -1 ? 0 : resolvedIndex;

        const newProducts = products.map((p, i) => (i === finalIndex ? { ...p, ...data } : p));

        const recomputed = get().recomputeProducts(newProducts);
        set({ products: recomputed });
        get().refreshCart();
    },

    clearCart: () => {
        set({ products: [] });
        get().refreshCart();
    },

    setAutoMerge: (enabled) => {
        set({ autoMerge: enabled });
    },

    checkCart: () => {
        const { order, products } = get();
        const unmatchedConditions: any[] = [];

        order.coupons.forEach((coupon: any) => {
            let isProductValid = true;
            if (coupon.products.length > 0) {
                isProductValid =
                    products.filter((product: OrderProduct) =>
                        coupon.products
                            .map((p: any) => p.product_id)
                            .includes(product.product_id),
                    ).length > 0;
                if (!isProductValid && unmatchedConditions.indexOf(coupon) === -1) {
                    unmatchedConditions.push(coupon);
                }
            }

            let isCategoryValid = true;
            if (coupon.categories.length > 0) {
                isCategoryValid =
                    products.filter((product: OrderProduct) =>
                        coupon.categories
                            .map((p: any) => p.category_id)
                            .includes(product.source?.category_id),
                    ).length > 0;
                if (!isCategoryValid && unmatchedConditions.indexOf(coupon) === -1) {
                    unmatchedConditions.push(coupon);
                }
            }
        });

        unmatchedConditions.forEach((coupon) => {
            toast.error(
                `The coupon "${coupon.name}" has been removed from the cart, as its required conditions are no longer met.`,
                { duration: 6000 },
            );
            get().removeCoupon(coupon);
        });
    },

    recomputeProducts: (products = null) => {
        const options = (get().options ?? {}) as any;
        const items = products ?? get().products;
        return items.map(item => computeItem(item, options));
    },
});
