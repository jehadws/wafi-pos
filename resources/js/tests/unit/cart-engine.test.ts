import { describe, it, expect } from 'vitest';
import {
    computeCart,
    computeItem,
    validateCoupons,
    computeInclusive,
    computeExclusive,
    getTaxValue,
    computeTaxForGroup,
    getSalePrice,
    getWholesalePrice,
    getCustomPrice,
    getStockUsage,
    calculateNewTaxValue,
    calculateTotalsForQuantityUpdate,
    calculateTotalsForPriceUpdate,
    calculateTotalsForDiscountPercentageUpdate,
} from '@/services/cart-engine';
import { OrderProduct } from '@/types/models/order-product';

describe('services/cart-engine.ts', () => {
    // ---------------------------------------------------------------------------
    // Section 1: Primitive Tax Math
    // ---------------------------------------------------------------------------

    describe('computeInclusive', () => {
        it('computes price without tax from inclusive price', () => {
            // 115 inclusive with 15% tax → 100 without tax
            const result = computeInclusive(115, 15);
            expect(Math.round(result)).toBe(100);
        });

        it('handles zero rate', () => {
            const result = computeInclusive(100, 0);
            expect(result).toBe(100);
        });
    });

    describe('computeExclusive', () => {
        it('computes price with tax from exclusive price', () => {
            // 100 exclusive with 15% tax → 115 with tax
            const result = computeExclusive(100, 15);
            expect(Math.round(result)).toBe(115);
        });

        it('handles zero rate', () => {
            const result = computeExclusive(100, 0);
            expect(result).toBe(100);
        });
    });

    describe('getTaxValue', () => {
        it('computes tax for inclusive type', () => {
            const result = getTaxValue('inclusive', 115, 15);
            expect(Math.round(result)).toBe(15);
        });

        it('computes tax for exclusive type', () => {
            const result = getTaxValue('exclusive', 100, 15);
            expect(Math.round(result)).toBe(15);
        });

        it('returns 0 for unknown type', () => {
            const result = getTaxValue('none', 100, 15);
            expect(result).toBe(0);
        });
    });

    describe('computeTaxForGroup', () => {
        it('computes tax split across multiple tax rates', () => {
            const taxGroup = {
                taxes: [
                    { id: 1, rate: 10 },
                    { id: 2, rate: 5 },
                ],
            };

            const result = computeTaxForGroup(100, taxGroup, 'exclusive');

            expect(result.tax_value).toBeCloseTo(15, 1);
            expect(result.price_with_tax).toBeCloseTo(115, 1);
            expect(result.price_without_tax).toBe(100);
            expect(result.taxes).toHaveLength(2);
        });

        it('returns zeros for zero price', () => {
            const taxGroup = { taxes: [{ id: 1, rate: 15 }] };
            const result = computeTaxForGroup(0, taxGroup, 'inclusive');

            expect(result.tax_value).toBe(0);
            expect(result.price_with_tax).toBe(0);
            expect(result.price_without_tax).toBe(0);
        });

        it('handles null tax group', () => {
            const result = computeTaxForGroup(100, null, 'exclusive');

            expect(result.tax_value).toBe(0);
            expect(result.price_with_tax).toBe(100);
            expect(result.price_without_tax).toBe(100);
        });
    });

    // ---------------------------------------------------------------------------
    // Section 2: Price Resolution
    // ---------------------------------------------------------------------------

    describe('getSalePrice', () => {
        it('returns price with tax when option is yes', () => {
            const quantities = {
                sale_price_with_tax: 115,
                sale_price_without_tax: 100,
            } as any;

            const result = getSalePrice(quantities, { sb_subul_price_with_tax: 'yes' } as any);
            expect(result).toBe(115);
        });

        it('returns price without tax when option is no', () => {
            const quantities = {
                sale_price_with_tax: 115,
                sale_price_without_tax: 100,
            } as any;

            const result = getSalePrice(quantities, { sb_subul_price_with_tax: 'no' } as any);
            expect(result).toBe(100);
        });
    });

    describe('getWholesalePrice', () => {
        it('returns wholesale price with tax when option is yes', () => {
            const quantities = {
                wholesale_price_with_tax: 92,
                wholesale_price_without_tax: 80,
            };

            const result = getWholesalePrice(quantities, { sb_subul_price_with_tax: 'yes' } as any);
            expect(result).toBe(92);
        });
    });

    describe('getCustomPrice', () => {
        it('returns custom price without tax when option is no', () => {
            const quantities = {
                custom_price_with_tax: 57.5,
                custom_price_without_tax: 50,
            };

            const result = getCustomPrice(quantities, { sb_subul_price_with_tax: 'no' } as any);
            expect(result).toBe(50);
        });
    });

    // ---------------------------------------------------------------------------
    // Section 3: Product-Level Computation
    // ---------------------------------------------------------------------------

    describe('computeItem', () => {
        const makeProduct = (overrides: Partial<OrderProduct> = {}): OrderProduct => {
            return {
                product_id: 1,
                name: 'Test Product',
                product_type: 'product',
                mode: 'normal',
                quantity: 2,
                discount: 0,
                discount_percentage: 0,
                discount_type: 'percentage',
                unit_price: 0,
                price_with_tax: 0,
                price_without_tax: 0,
                total_price: 0,
                total_price_with_tax: 0,
                total_price_without_tax: 0,
                tax_value: 0,
                total_tax_value: 0,
                tax_group_id: 1,
                tax_type: 'inclusive',
                unit_id: 1,
                unit_name: 'Piece',
                quantities: {
                    sale_price_with_tax: 115,
                    sale_price_without_tax: 100,
                    sale_price_edit: 100,
                    sale_price_tax: 15,
                    wholesale_price_with_tax: 92,
                    wholesale_price_without_tax: 80,
                    wholesale_price_edit: 80,
                    wholesale_price_tax: 12,
                    custom_price_with_tax: 0,
                    custom_price_without_tax: 0,
                    custom_price_edit: 0,
                    custom_price_tax: 0,
                } as any,
                source: {
                    id: 1,
                    category_id: 77,
                    tax_type: 'inclusive',
                    tax_group: {
                        taxes: [{ id: 1, rate: 15, name: 'VAT' }],
                    },
                },
                ...overrides,
            } as any;
        };

        const options = {
            sb_subul_price_with_tax: 'no',
            sb_subul_vat: 'products_vat',
        } as any;

        it('computes normal mode pricing with tax-inclusive', () => {
            const product = makeProduct({ mode: 'normal' });
            const result = computeItem(product, options);

            expect(result.unit_price).toBe(100); // sale_price_without_tax
            // total_price must be the full payable amount (with-tax) so that
            // order.subtotal and order.total are correct. Previously this was
            // the pre-tax amount (200), which caused the subtotal bug.
            expect(result.total_price).toBe(230); // sale_price_with_tax (115) * 2
            expect(result.total_tax_value).toBeCloseTo(30, 0); // 15 * 2
        });

        it('computes wholesale mode pricing', () => {
            const product = makeProduct({ mode: 'wholesale' });
            const result = computeItem(product, options);

            expect(result.unit_price).toBe(80); // wholesale_price_without_tax
            // total_price uses wholesale_price_with_tax (92) * 2
            expect(result.total_price).toBe(184); // wholesale_price_with_tax (92) * 2
        });

        it('keeps custom mode price unchanged', () => {
            const product = makeProduct({
                mode: 'custom',
                unit_price: 50,
            });
            const result = computeItem(product, options);

            expect(result.unit_price).toBe(50); // user-set price
        });

        it('applies flat discount correctly', () => {
            const product = makeProduct({ discount: 10 });
            const result = computeItem(product, options);

            // total_price = total_price_with_tax after discount applied in computeProductTaxValue
            expect(result.total_price).toBe(220); // (115 * 2) - 10
        });

        it('never mutates the input product', () => {
            const product = makeProduct();
            const originalPrice = product.unit_price;

            computeItem(product, options);

            expect(product.unit_price).toBe(originalPrice);
        });

        it('clones quantities to prevent mutation', () => {
            const product = makeProduct();
            const result = computeItem(product, options);

            expect(result.quantities).not.toBe(product.quantities);
        });

        it('handles products without tax groups', () => {
            const product = makeProduct({
                source: {
                    id: 1,
                    category_id: 77,
                    tax_type: 'none',
                    tax_group: null,
                },
            });
            const result = computeItem(product, options);

            expect(result.total_tax_value).toBe(0);
        });

        it('handles products without quantities (custom-priced lines)', () => {
            const product = makeProduct();
            delete product.quantities;

            const result = computeItem(product, options);

            // Without a quantities snapshot, no sale-price override is applied
            expect(result.unit_price).toBe(product.unit_price);
        });

        it('handles products without source (no tax group)', () => {
            const product = makeProduct();
            delete product.source;

            const result = computeItem(product, options);

            // No source snapshot means no tax group — zero tax
            expect(result.total_tax_value).toBe(0);
        });

        it('sells at the edit price with zero tax when VAT is disabled', () => {
            const product = makeProduct({ mode: 'normal' });
            const result = computeItem(product, { ...options, sb_subul_vat: 'disabled' });

            // The merchant-entered (edit) price — not the display-setting-derived price
            expect(result.unit_price).toBe(100); // sale_price_edit
            // Any leftover per-product tax group must be ignored
            expect(result.total_tax_value).toBe(0);
            expect(result.tax_value).toBe(0);
            // with/without-tax collapse to the same amount
            expect(result.price_with_tax).toBe(100);
            expect(result.price_without_tax).toBe(100);
            expect(result.total_price).toBe(200); // 100 * 2
            expect(result.total_price_with_tax).toBe(200);
            expect(result.total_price_without_tax).toBe(200);
        });

        it('ignores per-product tax groups for exclusive products when VAT is disabled', () => {
            const product = makeProduct({ mode: 'normal', tax_type: 'exclusive' });
            const result = computeItem(product, { ...options, sb_subul_vat: 'disabled' });

            expect(result.unit_price).toBe(100); // sale_price_edit
            expect(result.total_tax_value).toBe(0);
            expect(result.total_price).toBe(200);
            expect(result.total_price_with_tax).toBe(200);
        });

        it('applies VAT disabled to wholesale mode as well', () => {
            const product = makeProduct({ mode: 'wholesale' });
            const result = computeItem(product, { ...options, sb_subul_vat: 'disabled' });

            expect(result.unit_price).toBe(80); // wholesale_price_edit
            expect(result.total_tax_value).toBe(0);
            expect(result.total_price).toBe(160); // 80 * 2
        });
    });

    // ---------------------------------------------------------------------------
    // Section 4: Coupon Validation
    // ---------------------------------------------------------------------------

    describe('validateCoupons', () => {
        const makeProduct = (overrides: Partial<OrderProduct> = {}): OrderProduct => {
            return {
                product_id: 10,
                product_type: 'product',
                mode: 'normal',
                quantity: 1,
                discount: 0,
                discount_percentage: 0,
                discount_type: 'percentage',
                unit_price: 100,
                price_with_tax: 115,
                price_without_tax: 100,
                total_price: 100,
                total_price_with_tax: 115,
                total_price_without_tax: 100,
                tax_value: 15,
                total_tax_value: 15,
                tax_group_id: 1,
                tax_type: 'inclusive',
                unit_id: 1,
                unit_name: 'Piece',
                source: { category_id: 77 },
                ...overrides,
            } as any;
        };

        const options = {
            sb_subul_price_with_tax: 'no',
            sb_subul_vat: 'products_vat',
        } as any;

        it('validates product-specific coupons', () => {
            const products = [makeProduct({ product_id: 10 })];

            const validCoupon: any = {
                id: 1,
                name: 'Valid Coupon',
                products: [{ product_id: 10 }],
                categories: [],
            };

            const invalidCoupon: any = {
                id: 2,
                name: 'Invalid Coupon',
                products: [{ product_id: 99 }], // Product not in cart
                categories: [],
            };

            const result = validateCoupons(products, [validCoupon, invalidCoupon], options);

            expect(result.validCoupons).toHaveLength(1);
            expect(result.validCoupons[0].id).toBe(1);
            expect(result.invalidCoupons).toHaveLength(1);
            expect(result.invalidCoupons[0].id).toBe(2);
        });

        it('matches category constraints through source.category_id', () => {
            const matchingCategory: any = {
                id: 1,
                name: 'Cat Match',
                products: [],
                categories: [{ category_id: 77 }],
            };

            const nonMatchingCategory: any = {
                id: 2,
                name: 'Cat No Match',
                products: [],
                categories: [{ category_id: 99 }],
            };

            const products = [makeProduct()];

            const result = validateCoupons(products, [matchingCategory, nonMatchingCategory], options);

            expect(result.validCoupons).toHaveLength(1);
            expect(result.validCoupons[0].id).toBe(1);
            expect(result.invalidCoupons).toHaveLength(1);
        });

        it('accepts coupons with no product/category constraints', () => {
            const globalCoupon: any = {
                id: 1,
                name: 'Global',
                products: [],
                categories: [],
            };

            const products = [makeProduct()];
            const result = validateCoupons(products, [globalCoupon], options);

            expect(result.validCoupons).toHaveLength(1);
        });

        it('excludes coupons when the product has no source snapshot', () => {
            const product = makeProduct();
            delete product.source;

            const coupon: any = {
                id: 1,
                products: [],
                categories: [{ category_id: 77 }],
            };

            const result = validateCoupons([product], [coupon], options);

            expect(result.invalidCoupons).toHaveLength(1);
        });
    });

    // ---------------------------------------------------------------------------
    // Section 5: Full Cart Computation
    // ---------------------------------------------------------------------------

    describe('computeCart', () => {
        const makeLine = (overrides: Partial<OrderProduct> = {}): OrderProduct => {
            return {
                product_id: 1,
                product_type: 'product',
                mode: 'normal',
                quantity: 2,
                discount: 0,
                discount_percentage: 0,
                discount_type: 'percentage',
                unit_price: 0,
                price_with_tax: 0,
                price_without_tax: 0,
                total_price: 0,
                total_price_with_tax: 0,
                total_price_without_tax: 0,
                tax_value: 0,
                total_tax_value: 0,
                tax_group_id: 1,
                tax_type: 'inclusive',
                unit_id: 1,
                unit_name: 'Piece',
                quantities: { sale_price_with_tax: 115, sale_price_without_tax: 100, sale_price_edit: 100 } as any,
                source: { tax_group: null, tax_type: 'inclusive' },
                ...overrides,
            } as any;
        };

        const options = {
            sb_subul_price_with_tax: 'no',
            sb_subul_vat: 'products_vat',
        } as any;

        it('computes multi-item cart totals', () => {
            const draft = {
                products: [
                    makeLine({ product_id: 1, quantity: 2 }),
                    makeLine({ product_id: 2, quantity: 3 }),
                ],
                coupons: [],
                order: {
                    discount: 0,
                    discount_type: null,
                    tax_value: 0,
                    taxes: [],
                } as any,
            };

            const result = computeCart(draft, options);

            expect(result.products).toHaveLength(2);
            expect(result.order.subtotal).toBeGreaterThan(0);
        });

        it('returns empty coupon arrays when no coupons provided', () => {
            const draft = {
                products: [makeLine()],
                coupons: [],
                order: {} as any,
            };

            const result = computeCart(draft, options);

            expect(result.validCoupons).toEqual([]);
            expect(result.invalidCoupons).toEqual([]);
        });
    });

    // ---------------------------------------------------------------------------
    // Section 6: Stock Usage Helper
    // ---------------------------------------------------------------------------

    describe('getStockUsage', () => {
        it('sums quantities for matching product+unit', () => {
            const products = [
                { product_id: 1, unit_quantity_id: 10, quantity: 2 },
                { product_id: 1, unit_quantity_id: 10, quantity: 3 },
                { product_id: 1, unit_quantity_id: 20, quantity: 5 },
                { product_id: 2, unit_quantity_id: 10, quantity: 4 },
            ] as OrderProduct[];

            const result = getStockUsage(products, 1, 10);

            expect(result).toBe(5); // 2 + 3
        });

        it('returns 0 when no matches', () => {
            const products = [
                { product_id: 2, unit_quantity_id: 10, quantity: 2 },
            ] as OrderProduct[];

            const result = getStockUsage(products, 1, 10);

            expect(result).toBe(0);
        });
    });

    // ---------------------------------------------------------------------------
    // Section 7: Cart Calculator Utilities
    // ---------------------------------------------------------------------------

    describe('calculateNewTaxValue', () => {
        it('calculates proportional tax for new price', () => {
            const result = calculateNewTaxValue(100, 15, 200);

            expect(result.taxRate).toBe(15); // 15%
            expect(result.newTaxValue).toBe(30); // 15% of 200
        });

        it('returns zeros for invalid old price', () => {
            const result = calculateNewTaxValue(0, 15, 200);

            expect(result.taxRate).toBe(0);
            expect(result.newTaxValue).toBe(0);
        });
    });

    describe('calculateTotalsForQuantityUpdate', () => {
        const makeProduct = (): OrderProduct => {
            return {
                unit_price: 100,
                price_without_tax: 100,
                price_with_tax: 115,
                tax_value: 15,
                tax_type: 'exclusive',
                discount_type: 'flat',
                discount: 0,
                discount_percentage: 0,
            } as any;
        };

        it('calculates totals for new quantity (tax-exclusive, price with tax)', () => {
            const product = makeProduct();
            const result = calculateTotalsForQuantityUpdate(product, 3, true);

            // unit_price 100, quantity 3, tax-exclusive 15%
            // lineSubtotal = 300, totalBeforeTax = 300, totalTaxValue = 45
            // total_price (with tax) = 300 + 45 = 345
            expect(result.quantity).toBe(3);
            expect(result.total_price).toBe(345);
            expect(result.total_tax_value).toBeCloseTo(45, 0); // 15 * 3
            expect(result.total_price_without_tax).toBe(300);
        });

        it('calculates totals for new quantity (price without tax)', () => {
            const product = makeProduct();
            const result = calculateTotalsForQuantityUpdate(product, 3, false);

            // price without tax = 300
            expect(result.total_price).toBe(300);
            expect(result.total_tax_value).toBeCloseTo(45, 0);
        });

        it('applies percentage discount', () => {
            const product = {
                ...makeProduct(),
                discount_type: 'percentage' as const,
                discount_percentage: 10,
            };

            const result = calculateTotalsForQuantityUpdate(product, 2, true);

            expect(result.discount).toBe(20); // 10% of 200
        });
    });

    describe('calculateTotalsForPriceUpdate', () => {
        const makeProduct = (overrides: Partial<OrderProduct> = {}): OrderProduct => {
            return {
                unit_price: 100,
                price_without_tax: 100,
                price_with_tax: 115,
                tax_value: 15,
                tax_type: 'exclusive',
                quantity: 2,
                discount_percentage: 0,
                ...overrides,
            } as any;
        };

        it('sets mode to custom and interprets the entered price as with-tax', () => {
            const product = makeProduct();
            // Display = with-tax: the cashier types the gross price they saw (115).
            const result = calculateTotalsForPriceUpdate(product, 115, true);

            expect(result.mode).toBe('custom');
            // 15% exclusive: gross 115 → net 100, unit_price stays in the
            // product's tax basis (exclusive = net).
            expect(result.price_without_tax).toBeCloseTo(100, 5);
            expect(result.price_with_tax).toBeCloseTo(115, 5);
            expect(result.unit_price).toBeCloseTo(100, 5);
            expect(result.tax_value).toBeCloseTo(15, 5);
            // Typing the currently displayed price is a no-op.
            expect(result.total_price).toBeCloseTo(230, 5);
        });

        it('treats the entered price as net when display is without-tax', () => {
            const product = makeProduct();
            const result = calculateTotalsForPriceUpdate(product, 80, false);

            expect(result.price_without_tax).toBe(80);
            expect(result.price_with_tax).toBeCloseTo(92, 5); // 80 + 15%
            expect(result.unit_price).toBe(80); // exclusive basis = net
            expect(result.total_price).toBeCloseTo(184, 5); // payable = with-tax total
        });

        it('keeps unit_price in the inclusive basis for inclusive products', () => {
            const product = makeProduct({ tax_type: 'inclusive' });
            // Inclusive: displayed unit price (115) is the tax-in price.
            const result = calculateTotalsForPriceUpdate(product, 115, true);

            expect(result.price_without_tax).toBeCloseTo(100, 5);
            expect(result.price_with_tax).toBeCloseTo(115, 5);
            expect(result.unit_price).toBeCloseTo(115, 5); // tax-in basis
            expect(result.tax_value).toBeCloseTo(15, 5);
            expect(result.total_tax_value).toBeCloseTo(30, 5);
        });

        it('passes the price through untouched when the product has no tax', () => {
            const product = makeProduct({ tax_value: 0 });
            const result = calculateTotalsForPriceUpdate(product, 90, true);

            expect(result.price_without_tax).toBe(90);
            expect(result.price_with_tax).toBe(90);
            expect(result.total_tax_value).toBe(0);
            expect(result.total_price).toBe(180);
        });
    });

    describe('calculateTotalsForDiscountPercentageUpdate', () => {
        const makeProduct = (): OrderProduct => {
            return {
                unit_price: 100,
                price_without_tax: 100,
                price_with_tax: 115,
                tax_value: 15,
                tax_type: 'exclusive',
                quantity: 2,
                discount_percentage: 0,
            } as any;
        };

        it('calculates discount amount from percentage', () => {
            const product = makeProduct();
            const result = calculateTotalsForDiscountPercentageUpdate(product, 10, true);

            expect(result.discount_percentage).toBe(10);
            expect(result.discount).toBe(20); // 10% of 200
        });
    });

    // ---------------------------------------------------------------------------
    // Section 8: Immutability Assertions
    // ---------------------------------------------------------------------------

    describe('immutability', () => {
        const makeLine = (): OrderProduct => ({
            product_id: 1,
            product_type: 'product',
            mode: 'normal',
            quantity: 2,
            discount: 10,
            discount_percentage: 0,
            discount_type: 'flat',
            unit_price: 0,
            price_with_tax: 0,
            price_without_tax: 0,
            total_price: 0,
            total_price_with_tax: 0,
            total_price_without_tax: 0,
            tax_value: 0,
            total_tax_value: 0,
            tax_group_id: 1,
            tax_type: 'inclusive',
            unit_id: 1,
            unit_name: 'Piece',
            quantities: { sale_price_with_tax: 115, sale_price_without_tax: 100, sale_price_edit: 100 } as any,
            source: {
                id: 1,
                category_id: 77,
                tax_type: 'inclusive',
                tax_group: {
                    taxes: [{ id: 1, rate: 15, name: 'VAT' }],
                },
            },
        } as any);

        const options = {
            sb_subul_price_with_tax: 'no',
            sb_subul_vat: 'products_vat',
        } as any;

        it('computeItem returns new object', () => {
            const line = makeLine();
            const computed = computeItem(line, options);

            expect(computed).not.toBe(line);
        });

        it('quantities object is cloned, not shared', () => {
            const line = makeLine();
            const computed = computeItem(line, options);

            expect(computed.quantities).not.toBe(line.quantities);

            // Mutation of computed line should not affect original
            computed.quantities!.sale_price_with_tax = 999;
            expect(line.quantities!.sale_price_with_tax).toBe(115);
        });

        it('computeCart returns new products array', () => {
            const draft = {
                products: [makeLine()],
                coupons: [],
                order: {} as any,
            };

            const result = computeCart(draft, options);

            expect(result.products).not.toBe(draft.products);
            expect(result.products[0]).not.toBe(draft.products[0]);
        });

        it('computeCart does not mutate order', () => {
            const originalOrder = {
                discount: 0,
                tax_value: 0,
                taxes: [],
            } as any;

            const draft = {
                products: [makeLine()],
                coupons: [],
                order: originalOrder,
            };

            computeCart(draft, options);

            expect(originalOrder.tax_value).toBe(0); // Unchanged
        });
    });

    // ---------------------------------------------------------------------------
    // Section 9: Serializability (Phase 4/5 success criterion)
    //
    // Cart lines must survive JSON.stringify → parse round-trips so cart state
    // can be persisted, sent over the wire, or structured-cloned. This guards
    // against closures ($original, $quantities) sneaking back into state.
    // ---------------------------------------------------------------------------

    describe('serializability', () => {
        const makeLine = (): OrderProduct => ({
            product_id: 1,
            name: 'Test Product',
            product_type: 'product',
            mode: 'normal',
            quantity: 2,
            discount: 0,
            discount_percentage: 0,
            discount_type: 'percentage',
            unit_price: 0,
            price_with_tax: 0,
            price_without_tax: 0,
            total_price: 0,
            total_price_with_tax: 0,
            total_price_without_tax: 0,
            tax_value: 0,
            total_tax_value: 0,
            tax_group_id: 1,
            tax_type: 'inclusive',
            unit_id: 1,
            unit_name: 'Piece',
            unit_quantity_id: 5,
            quantities: {
                sale_price_with_tax: 115,
                sale_price_without_tax: 100,
                sale_price_edit: 100,
                wholesale_price_with_tax: 92,
                wholesale_price_without_tax: 80,
                wholesale_price_edit: 80,
            } as any,
            source: {
                id: 1,
                category_id: 77,
                tax_type: 'inclusive',
                tax_group: {
                    taxes: [{ id: 1, rate: 15, name: 'VAT' }],
                },
            },
        } as any);

        const options = {
            sb_subul_price_with_tax: 'no',
            sb_subul_vat: 'products_vat',
        } as any;

        it('computed line survives JSON round-trip with values intact', () => {
            const computed = computeItem(makeLine(), options);
            const revived = JSON.parse(JSON.stringify(computed));

            expect(revived.unit_price).toBe(computed.unit_price);
            expect(revived.total_price).toBe(computed.total_price);
            expect(revived.total_tax_value).toBe(computed.total_tax_value);
            expect(revived.quantities.sale_price_edit).toBe(
                computed.quantities!.sale_price_edit,
            );
            expect(revived.source.category_id).toBe(computed.source!.category_id);
        });

        it('computed line has no function properties at any depth', () => {
            const computed = computeItem(makeLine(), options);

            const findFunctions = (obj: any, path = '$') => {
                const found: string[] = [];
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'function') found.push(`${path}.${key}`);
                    else if (value !== null && typeof value === 'object') {
                        found.push(...findFunctions(value, `${path}.${key}`));
                    }
                }
                return found;
            };

            expect(findFunctions(computed)).toEqual([]);
        });

        it('coupon-validated cart output is fully serializable', () => {
            const coupon = {
                id: 1,
                name: 'Category Deal',
                products: [],
                categories: [{ category_id: 77 }],
            };

            const line = computeItem(makeLine(), options);
            const { validCoupons } = validateCoupons([line], [coupon as any], options);

            expect(validCoupons).toHaveLength(1);
            expect(() => JSON.stringify({ line, validCoupons })).not.toThrow();
        });
    });
});
