import { describe, expect, it } from 'vitest';
import {
    computeExclusive,
    computeInclusive,
    computeOrderTaxGroup,
    computeOrderTaxes,
    computeTaxForGroup,
    getPriceWithoutTax,
    getPriceWithTax,
    getTaxValue,
    getVatValue,
    proceedProductTaxComputation,
    sumProductsTaxes,
} from '@/services/tax';
import { Order } from '@/interfaces/order';
import { OrderProduct } from '@/interfaces/order-product';

describe('services/tax.ts', () => {
    describe('Primitive tax calculations', () => {
        it('calculates price excluding tax from inclusive price', () => {
            // Price is 115, rate is 15% -> pre-tax should be 100
            const preTax = computeInclusive(115, 15);
            expect(preTax).toBeCloseTo(100, 4);

            // Price is 100, rate is 20% -> pre-tax is 100 / 1.2 = 83.3333...
            const preTax20 = computeInclusive(100, 20);
            expect(preTax20).toBeCloseTo(83.3333, 4);
        });

        it('calculates price including tax from exclusive price', () => {
            // Pre-tax is 100, rate is 15% -> with tax should be 115
            const withTax = computeExclusive(100, 15);
            expect(withTax).toBeCloseTo(115, 4);

            // Pre-tax is 50, rate is 5% -> with tax should be 52.5
            const withTax5 = computeExclusive(50, 5);
            expect(withTax5).toBeCloseTo(52.5, 4);
        });

        it('calculates tax amount correctly for inclusive and exclusive types', () => {
            expect(getTaxValue('inclusive', 115, 15)).toBeCloseTo(15, 4);
            expect(getTaxValue('exclusive', 100, 15)).toBeCloseTo(15, 4);
            expect(getTaxValue('other', 100, 15)).toBe(0);
        });
    });

    describe('Price-level helpers', () => {
        it('getPriceWithoutTax returns correct values', () => {
            expect(getPriceWithoutTax(115, 15, 'inclusive')).toBeCloseTo(100, 4);
            expect(getPriceWithoutTax(100, 15, 'exclusive')).toBe(100);
            expect(getPriceWithoutTax(100, 15, 'none')).toBe(100);
        });

        it('getPriceWithTax returns correct values', () => {
            expect(getPriceWithTax(115, 15, 'inclusive')).toBe(115);
            expect(getPriceWithTax(100, 15, 'exclusive')).toBeCloseTo(115, 4);
            expect(getPriceWithTax(100, 15, 'none')).toBe(100);
        });

        it('getVatValue returns correct VAT values', () => {
            expect(getVatValue(115, 15, 'inclusive')).toBeCloseTo(15, 4);
            expect(getVatValue(100, 15, 'exclusive')).toBeCloseTo(15, 4);
            expect(getVatValue(100, 15, 'none')).toBe(0);
        });
    });

    describe('Tax Group calculations (computeTaxForGroup)', () => {
        const sampleTaxGroup = {
            id: 1,
            name: 'Standard VAT + Municipal',
            taxes: [
                { id: 1, tax_id: 101, name: 'VAT', rate: 15 },
                { id: 2, tax_id: 102, name: 'Municipal', rate: 5 },
            ],
        };

        it('computes combined tax for inclusive tax group (total rate 20%)', () => {
            // Price = 120 (inclusive of 15% + 5% = 20%) -> Pre-tax: 100, Total tax: 20
            const result = computeTaxForGroup(120, sampleTaxGroup, 'inclusive');
            expect(result.tax_value).toBeCloseTo(20, 4);
            expect(result.price_without_tax).toBeCloseTo(100, 4);
            expect(result.price_with_tax).toBeCloseTo(120, 4);
            expect(result.taxes).toHaveLength(2);
        });

        it('computes combined tax for exclusive tax group (total rate 20%)', () => {
            // Price = 100 (exclusive of 20%) -> Tax: 20, Total with tax: 120
            const result = computeTaxForGroup(100, sampleTaxGroup, 'exclusive');
            expect(result.tax_value).toBeCloseTo(20, 4);
            expect(result.price_without_tax).toBe(100);
            expect(result.price_with_tax).toBeCloseTo(120, 4);
        });

        it('handles zero or negative price gracefully', () => {
            const resultZero = computeTaxForGroup(0, sampleTaxGroup, 'inclusive');
            expect(resultZero.tax_value).toBe(0);
            expect(resultZero.price_with_tax).toBe(0);
            expect(resultZero.price_without_tax).toBe(0);
            expect(resultZero.taxes).toHaveLength(0);
        });

        it('handles missing or empty tax group', () => {
            const result = computeTaxForGroup(100, null, 'inclusive');
            expect(result.tax_value).toBe(0);
            expect(result.price_with_tax).toBe(100);
            expect(result.price_without_tax).toBe(100);
        });
    });

    describe('Order-level tax computations', () => {
        it('computeOrderTaxGroup distributes sub-taxes according to proportional rates', () => {
            const mockOrder: Order = {
                id: 1,
                subtotal: 120,
                discount: 0,
                tax_type: 'inclusive',
                tax_value: 0,
                total: 120,
                total_products: 1,
                products: [],
            } as any;

            const taxGroup = {
                id: 1,
                name: 'VAT 15 + Municipal 5',
                taxes: [
                    { id: 1, tax_id: 1, name: 'VAT', rate: '15' },
                    { id: 2, tax_id: 2, name: 'Municipal', rate: '5' },
                ],
            };

            const options = { ns_jgrem_vat: 'flat_vat' };
            const updatedOrder = computeOrderTaxGroup(mockOrder, taxGroup, options);

            expect(updatedOrder.taxes).toBeDefined();
            expect(updatedOrder.taxes?.length).toBe(2);
            // Total VAT on 120 with 20% inclusive rate is 20.
            // 15% rate gets (15/20) * 20 = 15
            // 5% rate gets (5/20) * 20 = 5
            expect(updatedOrder.taxes?.[0].tax_value).toBeCloseTo(15, 2);
            expect(updatedOrder.taxes?.[1].tax_value).toBeCloseTo(5, 2);
            expect(updatedOrder.tax_value).toBeCloseTo(20, 2);
        });

        it('computeOrderTaxes adds taxes when VAT mode is flat_vat or variable_vat', () => {
            const mockOrder: Order = {
                tax_value: 0,
                taxes: [
                    { name: 'VAT', rate: 15, tax_value: 15 },
                    { name: 'Service', rate: 5, tax_value: 5 },
                ],
            } as any;

            const updatedOrder = computeOrderTaxes(mockOrder, { ns_jgrem_vat: 'variable_vat' });
            expect(updatedOrder.tax_value).toBe(20);
        });

        it('sumProductsTaxes sums line item taxes and handles ns_jgrem_price_with_tax=no', () => {
            const mockOrder: Order = {
                subtotal: 200,
                products_tax_value: 0,
            } as any;

            const mockProducts: OrderProduct[] = [
                { id: 1, total_tax_value: 15, quantity: 1 } as any,
                { id: 2, total_tax_value: 10, quantity: 2 } as any,
            ];

            const updated = sumProductsTaxes(mockOrder, mockProducts, {
                ns_jgrem_vat: 'products_vat',
                ns_jgrem_price_with_tax: 'no',
            });

            expect(updated.products_tax_value).toBe(25);
            expect(updated.subtotal).toBe(225);
        });
    });

    describe('proceedProductTaxComputation', () => {
        it('computes unit and total tax values accurately for quantity > 1 with discount', () => {
            const mockProduct: OrderProduct = {
                id: 1,
                quantity: 2,
                discount: 10, // 10 discount total
                $original: () => ({
                    tax_group: {
                        taxes: [{ id: 1, rate: 15, name: 'VAT' }],
                    },
                    tax_type: 'exclusive',
                }),
            } as any;

            // Unit price 100 * 2 = 200 - 10 = 190 taxable
            // 15% on 190 = 28.5 total tax value
            // Per unit tax = 28.5 / 2 = 14.25
            const result = proceedProductTaxComputation(mockProduct, 100);
            expect(result.total_tax_value).toBeCloseTo(28.5, 4);
            expect(result.tax_value).toBeCloseTo(14.25, 4);
        });
    });
});
