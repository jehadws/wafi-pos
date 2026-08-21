import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePOS } from '@/hooks/usePOS';

describe('use-cart-store (Zustand Cart Slice)', () => {
    beforeEach(() => {
        usePOS.getState().reset();
    });

    it('adds a new product to cart correctly', async () => {
        const store = usePOS.getState();
        const product = {
            id: 1,
            name: 'Cold Brew Coffee',
            unit_price: 15,
            price_with_tax: 15,
            price_without_tax: 15,
            total_price: 15,
            quantity: 1,
            mode: 'normal',
        };

        await store.addToCart(product);

        const updatedProducts = usePOS.getState().products;
        expect(updatedProducts).toHaveLength(1);
        expect(updatedProducts[0].name).toBe('Cold Brew Coffee');
        expect(updatedProducts[0].quantity).toBe(1);
    });

    it('merges identical products when autoMerge is enabled', async () => {
        const store = usePOS.getState();
        store.setAutoMerge(true);

        const product = {
            id: 2,
            product_id: 2,
            name: 'Croissant',
            unit_price: 10,
            price_with_tax: 10,
            price_without_tax: 10,
            total_price: 10,
            quantity: 1,
            unit_id: 1,
            unit_quantity_id: 1,
        };

        await usePOS.getState().addToCart(product);
        await usePOS.getState().addToCart(product);

        const updatedProducts = usePOS.getState().products;
        expect(updatedProducts).toHaveLength(1);
        expect(updatedProducts[0].quantity).toBe(2);
    });

    it('removes a product from the cart', async () => {
        const product = {
            id: 3,
            name: 'Espresso',
            unit_price: 12,
            price_with_tax: 12,
            quantity: 1,
        };

        await usePOS.getState().addToCart(product);
        expect(usePOS.getState().products).toHaveLength(1);

        const cartProduct = usePOS.getState().products[0];
        usePOS.getState().removeProduct(cartProduct);

        expect(usePOS.getState().products).toHaveLength(0);
    });

    it('updates product quantity and attributes in the cart', async () => {
        const product = {
            id: 4,
            name: 'Tea',
            unit_price: 8,
            price_with_tax: 8,
            quantity: 1,
        };

        await usePOS.getState().addToCart(product);
        const cartProduct = usePOS.getState().products[0];

        usePOS.getState().updateProduct(cartProduct, { quantity: 3 });

        expect(usePOS.getState().products[0].quantity).toBe(3);
    });

    it('clears all products from the cart', async () => {
        await usePOS.getState().addToCart({ id: 5, name: 'Item 1', unit_price: 10, quantity: 1 });
        await usePOS.getState().addToCart({ id: 6, name: 'Item 2', unit_price: 20, quantity: 1 });

        expect(usePOS.getState().products).toHaveLength(2);

        usePOS.getState().clearCart();
        expect(usePOS.getState().products).toHaveLength(0);
    });
});
