/**
 * tests/unit/cart-engine.test.ts
 *
 * Consolidated suite for services/cart-engine.ts. Ports the behavioral
 * coverage of the former cart-calculator / pricing / tax / order-builder
 * suites (same golden values) and adds coverage for the new coupon helpers
 * and the CartEngine.computeCart facade (incl. immutability assertions).
 */

import { describe, expect, it } from 'vitest';
import {
    calculateNewTaxValue,
    calculateTotalsForDiscountPercentageUpdate,
    calculateTotalsForPriceUpdate,
    calculateTotalsForQuantityUpdate,
    CartEngine,
    computeCouponTotal,
    computeExclusive,
    computeInclusive,
    computeOrderTaxGroup,
    computeOrderTaxes,
    computeProduct,
    computeTaxForGroup,
    getCustomPrice,
    getPrice,
    getPriceWithoutTax,
    getPriceWithTax,
    getProductUnitPrice,
    getSalePrice,
    getStockUsage,
    getTaxValue,
    getVatValue,
    getWholesalePrice,
    proceedProductTaxComputation,
    recomputeProducts,
    sumProductsTaxes,
    sumProductsTotals,
    validateCoupons,
} from '@/services/cart-engine';
import { Coupon } from '@/types/models/coupon';
import { Order } from '@/types/models/order';
import { OrderProduct } from '@/types/models/order-product';

describe('services/cart-engine.ts', () => {
    // -----------------------------------------------------------------------
    // Ported from tests/unit/tax.test.ts
    // -----------------------------------------------------------------------

    describe('primitive tax calculations', () => {
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

    describe('price-level helpers', () => {
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

    describe('tax group calculations (computeTaxForGroup)', () => {
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

    describe('order-level tax computations', () => {
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
                source: {
                    tax_group: {
                        taxes: [{ id: 1, rate: 15, name: 'VAT' }],
                    },
                    tax_type: 'exclusive',
                },
            } as any;

            // Unit price 100 * 2 = 200 - 10 = 190 taxable
            // 15% on 190 = 28.5 total tax value
            // Per unit tax = 28.5 / 2 = 14.25
            const result = proceedProductTaxComputation(mockProduct, 100);
            expect(result.total_tax_value).toBeCloseTo(28.5, 4);
            expect(result.tax_value).toBeCloseTo(14.25, 4);
        });
    });

    // -----------------------------------------------------------------------
    // Ported from tests/unit/pricing.test.ts
    // -----------------------------------------------------------------------

    describe('mode-aware pricing getters', () => {
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

    // -----------------------------------------------------------------------
    // Ported from tests/unit/cart-calculator.test.ts
    // -----------------------------------------------------------------------

    describe('line-update calculators', () => {
        describe('calculateNewTaxValue', () => {
            it('calculates proportional tax value when price changes', () => {
                // Old price pre-tax = 100, old tax = 15 (15%) -> New price pre-tax = 200
                const result = calculateNewTaxValue(100, 15, 200);
                expect(result.taxRate).toBe(15);
                expect(result.newTaxValue).toBe(30);
            });

            it('safely handles zero or negative old price without returning NaN', () => {
                const result = calculateNewTaxValue(0, 0, 150);
                expect(result.taxRate).toBe(0);
                expect(result.newTaxValue).toBe(0);
                expect(Number.isNaN(result.newTaxValue)).toBe(false);
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

                const totals = calculateTotalsForQuantityUpdate(product, 3, true);
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
                const totals = calculateTotalsForQuantityUpdate(product, 2, true);
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

                const totals = calculateTotalsForPriceUpdate(product, 120, true);
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
                    tax_value: 15,
                    tax_type: 'exclusive',
                } as any;

                // Total pre-tax = 200, discount 20% = 40
                // Total without tax = 160
                // Tax = 160 * 15% = 24
                // Total with tax = 230 - 40 = 190
                const totals = calculateTotalsForDiscountPercentageUpdate(product, 20, true);
                expect(totals.discount).toBe(40);
                expect(totals.total_tax_value).toBe(24);
                expect(totals.total_price_without_tax).toBe(160);
                expect(totals.total_price_with_tax).toBe(190);
            });
        });
    });

    // -----------------------------------------------------------------------
    // Ported from tests/unit/order-builder.test.ts
    // -----------------------------------------------------------------------

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
                quantities: {
                    sale_price_with_tax: 115,
                    sale_price_without_tax: 100,
                } as any,
                source: {
                    tax_group: {
                        taxes: [{ id: 1, rate: 15, name: 'VAT' }],
                    },
                    tax_type: 'inclusive',
                },
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
                    quantities: { sale_price_with_tax: 50, sale_price_without_tax: 50 } as any,
                    source: { tax_group: null, tax_type: 'none' },
                } as any,
            ];

            const result = recomputeProducts(mockProducts, { ns_jgrem_price_with_tax: 'yes' });
            expect(result).toHaveLength(1);
            expect(result[0].total_price).toBe(50);
            expect(result).not.toBe(mockProducts);
        });
    });

    // -----------------------------------------------------------------------
    // New coverage: coupons
    // -----------------------------------------------------------------------

    describe('validateCoupons', () => {
        const cartLine = (overrides: Partial<OrderProduct> = {}): OrderProduct =>
            ({
                id: 1,
                product_id: 10,
                product_type: 'product',
                quantity: 1,
                source: { category_id: 77 },
                ...overrides,
            }) as any;

        it('marks unconstrained coupons as valid', () => {
            const coupon: Coupon = { name: 'Any', type: 'flat_discount', discount_value: 5 };
            const { validCoupons, invalidCoupons } = validateCoupons([coupon], []);
            expect(validCoupons).toHaveLength(1);
            expect(invalidCoupons).toHaveLength(0);
        });

        it('invalidates a coupon whose required product is not in the cart', () => {
            const coupon: Coupon = {
                name: 'Product-bound',
                type: 'flat_discount',
                discount_value: 5,
                products: [{ product_id: 999 }],
            };
            const { validCoupons, invalidCoupons } = validateCoupons([coupon], [cartLine()]);
            expect(validCoupons).toHaveLength(0);
            expect(invalidCoupons).toEqual([coupon]);
        });

        it('keeps a coupon whose required product is in the cart', () => {
            const coupon: Coupon = {
                name: 'Product-bound',
                type: 'flat_discount',
                discount_value: 5,
                products: [{ product_id: 10 }],
            };
            const { validCoupons, invalidCoupons } = validateCoupons([coupon], [cartLine()]);
            expect(validCoupons).toEqual([coupon]);
            expect(invalidCoupons).toHaveLength(0);
        });

        it('matches category constraints through source.category_id', () => {
            const matchingCategory: Coupon = {
                name: 'Cat match',
                type: 'percentage_discount',
                discount_value: 10,
                categories: [{ category_id: 77 }],
            };
            const otherCategory: Coupon = {
                name: 'Cat miss',
                type: 'percentage_discount',
                discount_value: 10,
                categories: [{ category_id: 88 }],
            };

            const { validCoupons, invalidCoupons } = validateCoupons(
                [matchingCategory, otherCategory],
                [cartLine()],
            );
            expect(validCoupons).toEqual([matchingCategory]);
            expect(invalidCoupons).toEqual([otherCategory]);
        });

        it('invalidates when either constraint fails and keeps a split result', () => {
            const okProduct: Coupon = {
                name: 'OK product',
                type: 'flat_discount',
                discount_value: 1,
                products: [{ product_id: 10 }],
            };
            const badCategory: Coupon = {
                name: 'Bad category',
                type: 'flat_discount',
                discount_value: 2,
                categories: [{ category_id: 1 }],
            };

            const { validCoupons, invalidCoupons } = validateCoupons(
                [okProduct, badCategory],
                [cartLine()],
            );
            expect(validCoupons).toEqual([okProduct]);
            expect(invalidCoupons).toEqual([badCategory]);
        });
    });

    describe('computeCouponTotal', () => {
        it('returns 0 for an empty coupon list', () => {
            expect(computeCouponTotal([], 500)).toBe(0);
        });

        it('sums flat discounts as-is', () => {
            const coupons: Coupon[] = [
                { name: 'A', type: 'flat_discount', discount_value: 10 },
                { name: 'B', type: 'flat_discount', discount_value: 5 },
            ];
            expect(computeCouponTotal(coupons, 500)).toBe(15);
        });

        it('scales percentage discounts with the subtotal', () => {
            const coupons: Coupon[] = [
                { name: 'Pct', type: 'percentage_discount', discount_value: 10 },
            ];
            expect(computeCouponTotal(coupons, 230)).toBeCloseTo(23, 6);
        });

        it('combines flat and percentage coupons', () => {
            const coupons: Coupon[] = [
                { name: 'Flat', type: 'flat_discount', discount_value: 10 },
                { name: 'Pct', type: 'percentage_discount', discount_value: 10 },
            ];
            // 10 + (500 * 10%) = 60
            expect(computeCouponTotal(coupons, 500)).toBeCloseTo(60, 6);
        });
    });

    // -----------------------------------------------------------------------
    // New coverage: CartEngine.computeCart facade
    // -----------------------------------------------------------------------

    describe('CartEngine.computeCart', () => {
        const options = { ns_jgrem_price_with_tax: 'yes', ns_jgrem_vat: 'products_vat' };

        const makeLine = (overrides: Partial<OrderProduct> = {}): OrderProduct =>
            ({
                id: 1,
                product_id: 10,
                name: 'Item',
                product_type: 'product',
                mode: 'normal',
                quantity: 2,
                unit_price: 0,
                price_with_tax: 115,
                price_without_tax: 100,
                tax_value: 0,
                tax_type: 'inclusive',
                discount: 0,
                discount_percentage: 0,
                discount_type: 'flat',
                total_price: 0,
                quantities: { sale_price_with_tax: 115, sale_price_without_tax: 100 } as any,
                source: { tax_group: null, tax_type: 'inclusive' },
                ...overrides,
            }) as any;

        const makeOrder = (overrides: Partial<Order> = {}): Order =>
            ({
                subtotal: 0,
                discount: 0,
                discount_type: null,
                discount_percentage: 0,
                total_coupons: 0,
                tax_value: 99,
                coupons: [],
                products: [],
                ...overrides,
            }) as any;

        it('recomputes lines, derives subtotal and resets server-computed tax_value', () => {
            const draft = {
                products: [makeLine()],
                coupons: [],
                order: makeOrder({ tax_value: 99 }),
            };

            const result = CartEngine.computeCart(draft, options);

            // Line recomputed from $quantities: unit 115 x qty 2 - 0 discount
            expect(result.products[0].unit_price).toBe(115);
            expect(result.products[0].total_price).toBe(230);
            // Subtotal aggregated from recomputed lines
            expect(result.order.subtotal).toBe(230);
            // Server-side tax value is reset for the async computeTaxes round-trip
            expect(result.order.tax_value).toBe(0);
        });

        it('applies percentage order discount against the recomputed subtotal', () => {
            const draft = {
                products: [makeLine()],
                coupons: [],
                order: makeOrder({
                    discount_type: 'percentage',
                    discount_percentage: 10,
                }),
            };

            const result = CartEngine.computeCart(draft, options);
            expect(result.order.discount).toBeCloseTo(23, 6);
        });

        it('caps a flat discount at the subtotal when no coupons exist', () => {
            const draft = {
                products: [makeLine()],
                coupons: [],
                order: makeOrder({ discount: 9999, discount_type: 'flat' }),
            };

            const result = CartEngine.computeCart(draft, options);
            expect(result.order.discount).toBe(230);
        });

        it('does not cap the discount while coupons still absorb the overflow', () => {
            const overflowCoupon: Coupon = { name: 'C', type: 'flat_discount', discount_value: 5 };
            const draft = {
                products: [makeLine()],
                coupons: [overflowCoupon],
                order: makeOrder({ discount: 9999, discount_type: 'flat' }),
            };

            const result = CartEngine.computeCart(draft, options);
            expect(result.order.discount).toBe(9999);
            expect(result.order.total_coupons).toBe(5);
        });

        it('totals coupons (percentage against subtotal) and splits valid/invalid', () => {
            const validCoupon: Coupon = {
                name: 'Valid',
                type: 'percentage_discount',
                discount_value: 10,
            };
            const invalidCoupon: Coupon = {
                name: 'Invalid',
                type: 'flat_discount',
                discount_value: 50,
                products: [{ product_id: 4242 }],
            };

            const draft = {
                products: [makeLine()],
                coupons: [validCoupon, invalidCoupon],
                order: makeOrder(),
            };

            const result = CartEngine.computeCart(draft, options);
            expect(result.order.total_coupons).toBeCloseTo(23, 6);
            expect(result.validCoupons).toEqual([validCoupon]);
            expect(result.invalidCoupons).toEqual([invalidCoupon]);
        });

        it('clones quantities so nested writes never leak into the input', () => {
            const line = makeLine();
            const computed = CartEngine.computeItem(line, options);

            expect(computed).not.toBe(line);
            expect(computed.quantities).not.toBe(line.quantities);

            computed.quantities!.sale_price_with_tax = 999;
            expect(line.quantities!.sale_price_with_tax).toBe(115);
        });

        it('does not mutate the draft inputs (immutability assertion)', () => {
            const line = makeLine();
            const order = makeOrder({ discount: 3000, discount_type: 'flat', tax_value: 42 });
            const draft = {
                products: [line],
                coupons: [],
                order,
            };

            const lineBefore = { ...line };
            const orderBefore = { ...order };

            CartEngine.computeCart(draft, options);

            // Input line untouched (new objects are returned instead)
            expect(line).toEqual(lineBefore);
            expect(order).toEqual(orderBefore);

            const result = CartEngine.computeCart(draft, options);
            expect(result.products[0]).not.toBe(line);
        });
    });
});