import { describe, expect, it, vi } from 'vitest';
import {
    computeProduct,
    getStockUsage,
    recomputeProducts,
} from '@/services/order-builder';
import { OrderProduct } from '@/interfaces/order-product';

describe('services/order-builder.ts', () => {
    describe('getStockUsage', () => {
        it('calculates total quantities for a specific product and unit in cart', () => {
            const products: OrderProduct[] = [
                { id: 1, product_id: 10, unit_quantity_id: 1, quantity: 2 } as any,
                { id: 2, product_id: 10, unit_quantity_id: 1, quantity: 3 } as any,
                { id: 3, product_id: 10, unit_quantity_id: 2, quantity: 5 } as any,
                { id: 4, product_id: 20, unit_quantity_id: 1, quantity: 1 } as any,
            ];

            expect(getStockUsage(products, 10, 1)).toBe(5);
            expect(getStockUsage(products, 10, 2)).toBe(5);
            expect(getStockUsage(products, 20, 1)).toBe(1);
            expect(getStockUsage(products, 30, 1)).toBe(0);
        });
    });

    describe('computeProduct and recomputeProducts', () => {
        it('computes normal mode product with discount and tax correctly', () => {
            const mockProduct: OrderProduct = {
                id: 1,
                product_type: 'product',
                mode: 'normal',
                quantity: 2,
                discount: 10,
                $quantities: () => ({
                    sale_price_with_tax: 115,
                    sale_price_without_tax: 100,
                }),
                $original: () => ({
                    tax_group: {
                        taxes: [{ id: 1, rate: 15, name: 'VAT' }],
                    },
                    tax_type: 'inclusive',
                }),
            } as any;

            const options = {
                ns_jgrem_price_with_tax: 'yes',
                ns_jgrem_vat: 'products_vat',
            };

            const computed = computeProduct(mockProduct, options);
            expect(computed.unit_price).toBe(115);
            // total_price = (115 * 2) - 10 = 220
            expect(computed.total_price).toBe(220);
            expect(computed).not.toBe(mockProduct); // Immutable copy returned
        });

        it('recomputeProducts recomputes array of products immutably', () => {
            const mockProducts: OrderProduct[] = [
                {
                    id: 1,
                    product_type: 'product',
                    mode: 'normal',
                    quantity: 1,
                    discount: 0,
                    $quantities: () => ({ sale_price_with_tax: 50, sale_price_without_tax: 50 }),
                    $original: () => ({ tax_group: null, tax_type: 'none' }),
                } as any,
            ];

            const result = recomputeProducts(mockProducts, { ns_jgrem_price_with_tax: 'yes' });
            expect(result).toHaveLength(1);
            expect(result[0].total_price).toBe(50);
            expect(result).not.toBe(mockProducts);
        });
    });
});
