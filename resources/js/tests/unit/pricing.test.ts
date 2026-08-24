import { describe, expect, it } from 'vitest';
import {
    getCustomPrice,
    getPrice,
    getProductUnitPrice,
    getSalePrice,
    getWholesalePrice,
    sumProductsTotals,
} from '@/services/pricing';
import { Order } from '@/types/models/order';
import { OrderProduct } from '@/types/models/order-product';

describe('services/pricing.ts', () => {
    describe('getSalePrice / getCustomPrice / getWholesalePrice', () => {
        const mockUnitQuantity = {
            id: 1,
            sale_price_with_tax: 115,
            sale_price_without_tax: 100,
            wholesale_price_with_tax: 92,
            wholesale_price_without_tax: 80,
            custom_price_with_tax: 57.5,
            custom_price_without_tax: 50,
        };

        it('returns with_tax price when ns_jgrem_price_with_tax is yes', () => {
            const options = { ns_jgrem_price_with_tax: 'yes' };
            expect(getSalePrice(mockUnitQuantity as any, options)).toBe(115);
            expect(getWholesalePrice(mockUnitQuantity as any, options)).toBe(92);
            expect(getCustomPrice(mockUnitQuantity as any, options)).toBe(57.5);
        });

        it('returns without_tax price when ns_jgrem_price_with_tax is no', () => {
            const options = { ns_jgrem_price_with_tax: 'no' };
            expect(getSalePrice(mockUnitQuantity as any, options)).toBe(100);
            expect(getWholesalePrice(mockUnitQuantity as any, options)).toBe(80);
            expect(getCustomPrice(mockUnitQuantity as any, options)).toBe(50);
        });

        it('handles undefined or null quantities gracefully', () => {
            expect(getSalePrice(undefined, { ns_jgrem_price_with_tax: 'yes' })).toBe(0);
        });
    });

    describe('getPrice and getProductUnitPrice', () => {
        const mockQuantities = {
            sale_price_edit: 105,
            sale_price_with_tax: 115,
            wholesale_price_edit: 85,
            wholesale_price_with_tax: 92,
            custom_price_edit: 55,
            custom_price_with_tax: 57.5,
        };

        it('retrieves correct price key based on mode and suffix', () => {
            expect(getPrice(mockQuantities, 'normal', 'with_tax')).toBe(115);
            expect(getPrice(mockQuantities, 'wholesale', 'with_tax')).toBe(92);
            expect(getPrice(mockQuantities, 'custom', 'with_tax')).toBe(57.5);
            expect(getPrice(mockQuantities, 'unknown', 'with_tax')).toBe(0);
        });

        it('retrieves editable unit price based on mode', () => {
            expect(getProductUnitPrice('normal', mockQuantities)).toBe(105);
            expect(getProductUnitPrice('wholesale', mockQuantities)).toBe(85);
            expect(getProductUnitPrice('custom', mockQuantities)).toBe(55);
            expect(getProductUnitPrice('unknown', mockQuantities)).toBe(0);
        });
    });

    describe('sumProductsTotals', () => {
        it('calculates subtotal for regular products', () => {
            const order: Order = { subtotal: 0 } as any;
            const products: OrderProduct[] = [
                { id: 1, product_type: 'product', total_price: 150, total_tax_value: 0, quantity: 1 } as any,
                { id: 2, product_type: 'product', total_price: 250, total_tax_value: 0, quantity: 2 } as any,
            ];

            const updated = sumProductsTotals(order, products, { ns_jgrem_vat: 'flat_vat' });
            expect(updated.subtotal).toBe(400);
            expect(updated.total_products).toBe(2);
        });

        it('calculates dynamic product totals (e.g. percentage-based service fee)', () => {
            const order: Order = { subtotal: 0 } as any;
            const products: OrderProduct[] = [
                { id: 1, product_type: 'product', total_price: 100, total_tax_value: 0, quantity: 1 } as any,
                // dynamic product with 10% rate on total static products
                { id: 2, product_type: 'dynamic', rate: 10, quantity: 1, total_tax_value: 0 } as any,
            ];

            const updated = sumProductsTotals(order, products, { ns_jgrem_vat: 'flat_vat' });
            // Static total = 100
            // Dynamic item 2 unit_price = 100 * 10% = 10, total_price = 10
            // Order subtotal = 100 + 10 = 110
            expect(updated.subtotal).toBe(110);
            expect(products[1].unit_price).toBe(10);
            expect(products[1].total_price).toBe(10);
        });

        it('sets subtotal to 0 when products array is empty', () => {
            const order: Order = { subtotal: 100 } as any;
            const updated = sumProductsTotals(order, [], { ns_jgrem_vat: 'flat_vat' });
            expect(updated.subtotal).toBe(0);
        });
    });
});
