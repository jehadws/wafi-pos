import { describe, expect, it } from 'vitest';
import { CartCalculator } from '@/services/cart-calculator';
import { OrderProduct } from '@/interfaces/order-product';

describe('services/cart-calculator.ts', () => {
    describe('calculateNewTaxValue', () => {
        it('calculates proportional tax value when price changes', () => {
            // Old price pre-tax = 100, old tax = 15 (15%) -> New price pre-tax = 200
            const result = CartCalculator.calculateNewTaxValue(100, 15, 200);
            expect(result.taxRate).toBe(15);
            expect(result.newTaxValue).toBe(30);
        });
    });

    describe('calculateTotalsForQuantityUpdate', () => {
        it('calculates totals for tax-exclusive product without discount', () => {
            const product: OrderProduct = {
                unit_price: 50,
                price_without_tax: 50,
                tax_value: 7.5, // 15%
                tax_type: 'exclusive',
                discount_type: 'flat',
                discount: 0,
            } as any;

            const totals = CartCalculator.calculateTotalsForQuantityUpdate(product, 3, true);
            // 50 * 3 = 150 before tax
            // 150 * 15% = 22.5 tax
            // total with tax = 172.5
            expect(totals.quantity).toBe(3);
            expect(totals.discount).toBe(0);
            expect(totals.total_tax_value).toBeCloseTo(22.5, 2);
            expect(totals.total_price_with_tax).toBeCloseTo(172.5, 2);
            expect(totals.total_price_without_tax).toBeCloseTo(150, 2);
            expect(totals.total_price).toBeCloseTo(172.5, 2);
        });

        it('calculates totals for tax-inclusive product with percentage discount', () => {
            const product: OrderProduct = {
                unit_price: 115,
                price_without_tax: 100,
                tax_value: 15, // 15% rate
                tax_type: 'inclusive',
                discount_type: 'percentage',
                discount_percentage: 10,
            } as any;

            // Quantity 2 -> line subtotal = 230
            // 10% discount = 23
            // line total before tax calculation = 207
            // with 15% inclusive tax -> taxMultiplier = 1.15
            // pre-tax = 207 / 1.15 = 180
            // tax = 207 - 180 = 27
            const totals = CartCalculator.calculateTotalsForQuantityUpdate(product, 2, true);
            expect(totals.discount).toBe(23);
            expect(totals.total_tax_value).toBeCloseTo(27, 2);
            expect(totals.total_price_with_tax).toBeCloseTo(234, 2); // Note: totalBeforeTax (207) + totalTaxValue (27)
        });
    });

    describe('calculateTotalsForPriceUpdate', () => {
        it('calculates totals when user manually edits item price', () => {
            const product: OrderProduct = {
                quantity: 2,
                discount_percentage: 0,
                price_without_tax: 100,
                tax_value: 15,
            } as any;

            const totals = CartCalculator.calculateTotalsForPriceUpdate(product, 120, true);
            expect(totals.unit_price).toBe(120);
            expect(totals.price_without_tax).toBe(120);
            expect(totals.tax_value).toBe(18); // 120 * 15%
            expect(totals.total_tax_value).toBe(36); // 18 * 2
            expect(totals.total_price_with_tax).toBe(276); // (120*2) + 36
            expect(totals.mode).toBe('custom');
        });
    });

    describe('calculateTotalsForDiscountPercentageUpdate', () => {
        it('updates discount and net totals accurately', () => {
            const product: OrderProduct = {
                quantity: 2,
                price_without_tax: 100,
                price_with_tax: 115,
            } as any;

            // Total pre-tax = 200, discount 20% = 40
            // Total without tax = 160
            // Total with tax = 230 - 40 = 190
            const totals = CartCalculator.calculateTotalsForDiscountPercentageUpdate(product, 20, true);
            expect(totals.discount).toBe(40);
            expect(totals.total_price_without_tax).toBe(160);
            expect(totals.total_price_with_tax).toBe(190);
        });
    });
});
