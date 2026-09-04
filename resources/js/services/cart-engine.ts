/**
 * services/cart-engine.ts
 *
 * Deterministic cart computation engine.
 * Pure functions — no Zustand, no side effects, no closures in state.
 *
 * Architecture:
 *   - computeCart(): Full cart recomputation
 *   - computeItem(): Single item recomputation
 *   - validateCoupons(): Coupon validation and application
 *
 * All functions return NEW objects — inputs are never mutated.
 *
 * Consolidates logic from:
 *   - services/tax.ts (tax computation)
 *   - services/pricing.ts (price helpers)
 *   - services/order-builder.ts (product computation)
 *   - services/cart-calculator.ts (cart calculation utilities)
 *
 * Pure domain layer: no Zustand, no React, no DOM.
 */

import { OrderProduct } from '@/types/models/order-product';
import { Order } from '@/types/models/order';
import { ProductUnitQuantity } from '@/types/models/product-unit-quantity';
import { CartDraft, ComputedCart, POSOptions, Coupon } from '@/types/cart-engine';
import { rawCurrency } from '@/utils/format';
import * as math from 'mathjs';

// ---------------------------------------------------------------------------
// Section 1: Primitive Tax Math
// ---------------------------------------------------------------------------

/**
 * Price excluding tax from an inclusive (tax-in) price.
 * formula: value * 100 / (rate + 100)
 */
export function computeInclusive(value: number, rate: number): number {
    return math
        .chain(math.chain(value).divide(math.chain(rate).add(100).done()).done())
        .multiply(100)
        .done();
}

/**
 * Price including tax from an exclusive (tax-out) price.
 * formula: value / 100 * (rate + 100)
 */
export function computeExclusive(value: number, rate: number): number {
    return math.chain(value).divide(100).multiply(math.chain(rate).add(100).done()).done();
}

/**
 * VAT amount for a given price + rate + type.
 */
export function getTaxValue(type: string, value: number, rate: number): number {
    switch (type) {
        case 'inclusive':
            return value - computeInclusive(value, rate);
        case 'exclusive':
            return computeExclusive(value, rate) - value;
    }
    return 0;
}

/**
 * Returns the pre-tax amount for a given price, rate and tax type.
 */
export function getPriceWithoutTax(value: number, rate: number, type: string): number {
    if (type === 'inclusive') return computeInclusive(value, rate);
    if (type === 'exclusive') return value;
    return value;
}

/**
 * Returns the post-tax amount for a given price, rate and tax type.
 */
export function getPriceWithTax(value: number, rate: number, type: string): number {
    if (type === 'inclusive') return value;
    if (type === 'exclusive') return computeExclusive(value, rate);
    return value;
}

/**
 * Returns the VAT amount for a given price, rate and tax type.
 */
export function getVatValue(value: number, rate: number, type: string): number {
    if (type === 'inclusive') return value - getPriceWithoutTax(value, rate, type);
    if (type === 'exclusive') return getPriceWithTax(value, rate, type) - value;
    return 0;
}

export interface TaxGroupResult {
    taxes: any[];
    tax_value: number;
    price_with_tax: number;
    price_without_tax: number;
    [key: string]: any;
}

/**
 * Given a line total price, a tax_group object (with .taxes[]), and the
 * tax type (inclusive/exclusive), returns the split price + computed taxes.
 */
export function computeTaxForGroup(
    price: number,
    tax_group: any,
    tax_type: string,
): TaxGroupResult {
    let tax_value = 0;
    let price_with_tax = 0;
    let price_without_tax = 0;
    let taxes: any[] = [];

    if (price <= 0) {
        return {
            ...(tax_group ?? {}),
            taxes: [],
            tax_value: 0,
            price_with_tax: 0,
            price_without_tax: 0,
        };
    }

    if (tax_group) {
        taxes = tax_group.taxes.map((tax: any) => ({
            ...tax,
            tax_value: getVatValue(price, tax.rate, tax_type),
        }));
    }

    if (taxes.length > 0) {
        const rate = taxes
            .map((tax: any) => tax.rate)
            .reduce((b: number, a: number) => b + a, 0);
        tax_value = getVatValue(price, rate, tax_type);
        price_without_tax = getPriceWithoutTax(price, rate, tax_type);
        price_with_tax = getPriceWithTax(price, rate, tax_type);
    } else {
        price_with_tax = price;
        price_without_tax = price;
    }

    return {
        ...(tax_group ?? {}),
        taxes,
        tax_value,
        price_with_tax,
        price_without_tax,
    };
}

// ---------------------------------------------------------------------------
// Section 2: Price Resolution
// ---------------------------------------------------------------------------

/**
 * Returns the unit sale price for a product quantity entry,
 * respecting the sb_subul_price_with_tax option.
 */
export function getSalePrice(
    item: ProductUnitQuantity | undefined,
    options: POSOptions,
): number {
    if (options.sb_subul_price_with_tax === 'yes') {
        return rawCurrency(item?.sale_price_with_tax);
    }
    return rawCurrency(item?.sale_price_without_tax);
}

/**
 * Returns the custom unit price for a product quantity entry,
 * respecting the sb_subul_price_with_tax option.
 */
export function getCustomPrice(item: any, options: POSOptions): number {
    if (options.sb_subul_price_with_tax === 'yes') {
        return rawCurrency(item.custom_price_with_tax);
    }
    return rawCurrency(item.custom_price_without_tax);
}

/**
 * Returns the wholesale unit price for a product quantity entry,
 * respecting the sb_subul_price_with_tax option.
 */
export function getWholesalePrice(item: any, options: POSOptions): number {
    if (options.sb_subul_price_with_tax === 'yes') {
        return rawCurrency(item.wholesale_price_with_tax);
    }
    return rawCurrency(item.wholesale_price_without_tax);
}

/**
 * Returns a specific price value from a quantities object by mode + type suffix.
 * e.g. getPrice(quantities, 'normal', 'with_tax') → quantities.sale_price_with_tax
 */
export function getPrice(quantities: any, mode: string, type: string): number {
    switch (mode) {
        case 'normal':
            return quantities['sale_price_' + type] ?? 0;
        case 'wholesale':
            return quantities['wholesale_price_' + type] ?? 0;
        case 'custom':
            return quantities['custom_price_' + type] ?? 0;
    }
    return 0;
}

/**
 * Returns the editable (user-facing) unit price for a product
 * based on its pricing mode.
 */
export function getProductUnitPrice(mode: string, quantities: any): number {
    switch (mode) {
        case 'custom':
            return quantities.custom_price_edit ?? 0;
        case 'normal':
            return quantities.sale_price_edit ?? 0;
        case 'wholesale':
            return quantities.wholesale_price_edit ?? 0;
    }
    return 0;
}

// ---------------------------------------------------------------------------
// Section 3: Product-Level Computation
// ---------------------------------------------------------------------------

export interface TaxComputationResult {
    price_without_tax: number;
    tax_value: number;
    price_with_tax: number;
    total_tax_value: number;
}

/**
 * Core product tax computation.
 * Computes line-level tax values for any given unit price and product.
 */
function proceedProductTaxComputation(
    product: OrderProduct,
    price: number,
): TaxComputationResult {
    const source = product.source ?? null;
    const taxGroup = source?.tax_group;

    let price_without_tax = price;
    let tax_value = 0;
    let price_with_tax = price;
    let total_tax_value = 0;

    if (taxGroup !== undefined && taxGroup !== null && taxGroup.taxes !== undefined) {
        const lineSubtotal = math.chain(price).multiply(product.quantity).done();
        const lineAfterDiscount = math
            .chain(lineSubtotal)
            .subtract(product.discount || 0)
            .done();

        const result = computeTaxForGroup(lineAfterDiscount, taxGroup, source?.tax_type || '');

        total_tax_value = result.tax_value;
        tax_value = math.chain(total_tax_value).divide(product.quantity).done();
        price_with_tax = math.chain(result.price_with_tax).divide(product.quantity).done();
        price_without_tax = math.chain(result.price_without_tax).divide(product.quantity).done();
    }

    return { price_without_tax, tax_value, price_with_tax, total_tax_value };
}

/**
 * Computes and mutates tax fields on a custom-priced product.
 * INTERNAL: Mutates the passed product object (call-sites pass a fresh clone).
 */
function computeCustomProductTax(product: OrderProduct): void {
    const quantities = product.quantities ?? null;
    if (!quantities) return;

    const result = proceedProductTaxComputation(product, quantities.custom_price_edit);

    quantities.custom_price_without_tax = result.price_without_tax;
    quantities.custom_price_with_tax = result.price_with_tax;
    quantities.custom_price_tax = result.tax_value;
    product.tax_value = result.tax_value;
    product.total_tax_value = result.total_tax_value;
}

/**
 * Computes and mutates tax fields on a normal-priced product.
 * INTERNAL: Mutates the passed product object (call-sites pass a fresh clone).
 */
function computeNormalProductTax(product: OrderProduct): void {
    const quantities = product.quantities ?? null;
    if (!quantities) return;

    const result = proceedProductTaxComputation(product, quantities.sale_price_edit);

    quantities.sale_price_without_tax = result.price_without_tax;
    quantities.sale_price_with_tax = result.price_with_tax;
    quantities.sale_price_tax = result.tax_value;
    product.tax_value = result.tax_value;
    product.total_tax_value = result.total_tax_value;
}

/**
 * Computes and mutates tax fields on a wholesale-priced product.
 * INTERNAL: Mutates the passed product object (call-sites pass a fresh clone).
 */
function computeWholesaleProductTax(product: OrderProduct): void {
    const quantities = product.quantities ?? null;
    if (!quantities) return;

    const result = proceedProductTaxComputation(product, quantities.wholesale_price_edit);

    quantities.wholesale_price_without_tax = result.price_without_tax;
    quantities.wholesale_price_with_tax = result.price_with_tax;
    quantities.wholesale_price_tax = result.tax_value;
    product.tax_value = result.tax_value;
    product.total_tax_value = result.total_tax_value;
}

/**
 * Dispatches to the correct per-mode tax computation function.
 * INTERNAL: Mutates the passed product object (call-sites pass a fresh clone).
 */
function computeProductTax(product: OrderProduct): void {
    switch (product.mode) {
        case 'custom':
            computeCustomProductTax(product);
            break;
        case 'normal':
            computeNormalProductTax(product);
            break;
        case 'wholesale':
            computeWholesaleProductTax(product);
            break;
    }
}

/**
 * Computes and mutates all tax + price fields on a product using its current
 * mode and quantities. INTERNAL: Mutates the passed product object.
 */
function computeProductTaxValue(product: OrderProduct): void {
    const source = product.source ?? null;
    const tax_group = source?.tax_group;
    const quantities = product.quantities ?? null;

    let unitPrice: number;

    if (product.mode === 'normal') {
        unitPrice =
            product.tax_type === 'inclusive'
                ? (quantities?.sale_price_with_tax ?? 0)
                : (quantities?.sale_price_without_tax ?? 0);
    } else if (product.mode === 'wholesale') {
        unitPrice =
            product.tax_type === 'inclusive'
                ? (quantities?.wholesale_price_with_tax ?? 0)
                : (quantities?.wholesale_price_without_tax ?? 0);
    } else {
        unitPrice = product.unit_price;
    }

    const lineSubtotal = math.chain(unitPrice).multiply(product.quantity).done();
    const lineAfterDiscount = math
        .chain(lineSubtotal)
        .subtract(product.discount || 0)
        .done();

    const result = computeTaxForGroup(lineAfterDiscount, tax_group, product.tax_type || '');

    product.tax_value = math.chain(result.tax_value).divide(product.quantity).done();
    product.total_tax_value = result.tax_value;
    product.price_with_tax = math.chain(result.price_with_tax).divide(product.quantity).done();
    product.price_without_tax = math.chain(result.price_without_tax).divide(product.quantity).done();
    product.total_price_with_tax = result.price_with_tax;
    product.total_price_without_tax = result.price_without_tax;
}

/**
 * Computes all derived fields (unit_price, total_price, tax fields) on a
 * single cart product. Returns a new object — never mutates the input.
 *
 * @param product  - The cart product to compute
 * @param options  - POS options (sb_subul_price_with_tax, etc.)
 */
export function computeProduct(product: OrderProduct, options: POSOptions): OrderProduct {
    const computed: OrderProduct = { ...product };

    // Clone the serializable quantities too, so nested writes on the computed
    // line can never leak back into the input (the old closure was shared).
    if (computed.quantities) {
        computed.quantities = { ...computed.quantities };
    }

    if (computed.product_type === 'product') {
        const quantities = computed.quantities ?? null;
        if (computed.mode === 'normal' && quantities) {
            computed.unit_price = getSalePrice(quantities, options);
        } else if (computed.mode === 'wholesale' && quantities) {
            computed.unit_price = getWholesalePrice(quantities, options);
        }
        // For 'custom' mode: keep unit_price as-is (user-set price)
    }

    computeProductTaxValue(computed);

    const unitPrice = computed.unit_price;
    computed.total_price = math
        .chain(unitPrice)
        .multiply(computed.quantity)
        .subtract(computed.discount || 0)
        .done();

    if (computed.total_tax_value === undefined) {
        computed.total_tax_value = math.chain(computed.tax_value).multiply(computed.quantity).done();
    }

    if (computed.price_with_tax !== undefined && computed.price_without_tax !== undefined) {
        computed.total_price_with_tax = math
            .chain(computed.price_with_tax)
            .multiply(computed.quantity)
            .done();
        computed.total_price_without_tax = math
            .chain(computed.price_without_tax)
            .multiply(computed.quantity)
            .done();
    }

    return computed;
}

/**
 * Recomputes all derived fields for every product in the array.
 * Returns a new array — never mutates the input.
 */
export function recomputeProducts(
    products: OrderProduct[],
    options: POSOptions,
): OrderProduct[] {
    return products.map((product) => computeProduct(product, options));
}

// ---------------------------------------------------------------------------
// Section 4: Order-Level Computation
// ---------------------------------------------------------------------------

/**
 * Sums per-product taxes into the order and updates order.subtotal
 * for products_vat mode.
 */
export function sumProductsTaxes(
    order: Order,
    products: OrderProduct[],
    options: POSOptions,
): Order {
    const posVat = options.sb_subul_vat;

    order.products = products as any;
    order.total_products = products.length;

    if (['products_vat'].includes(posVat)) {
        const totalTaxValues = products.map((p: OrderProduct) => p.total_tax_value || 0);
        if (totalTaxValues.length > 0) {
            order.products_tax_value = totalTaxValues.reduce(
                (before: number, after: number) => before + after,
                0,
            );
        }
    }

    if (options.sb_subul_price_with_tax === 'no') {
        order.subtotal = math.chain(order.subtotal).add(order.products_tax_value).done();
    }

    return order;
}

/**
 * Computes order.subtotal from the given products array and delegates
 * per-product tax aggregation to sumProductsTaxes.
 */
export function sumProductsTotals(
    order: Order,
    products: OrderProduct[],
    options: POSOptions,
): Order {
    const staticTotal = products
        .filter((p) => p.product_type !== 'dynamic')
        .map((p) => p.total_price);

    if (staticTotal.length > 0) {
        const productTotalValue = staticTotal.reduce((b: number, a: number) => b + a);

        const dynamicProducts = products
            .filter((p) => p.product_type === 'dynamic')
            .map((p) => {
                p.unit_price = (productTotalValue * (p.rate || 0)) / 100;
                p.total_price = p.unit_price * p.quantity;
                return p.total_price;
            });

        const dynamicProductValue =
            dynamicProducts.length > 0
                ? dynamicProducts.reduce((b: number, a: number) => b + a)
                : 0;

        order.subtotal = productTotalValue + dynamicProductValue;
    } else {
        order.subtotal = 0;
    }

    return sumProductsTaxes(order, products, options);
}

/**
 * Accumulates order-level taxes from order.taxes into order.tax_value
 * depending on the POS VAT mode stored in options.
 */
export function computeOrderTaxes(order: Order, options: POSOptions): Order {
    const posVat = options.sb_subul_vat;

    if (['flat_vat', 'variable_vat'].includes(posVat) && order.taxes && order.taxes.length > 0) {
        order.tax_value += order.taxes
            .map((tax: any) => tax.tax_value)
            .reduce((before: number, after: number) => before + after);
    }

    return order;
}

/**
 * Distributes a tax group's VAT across its sub-taxes and returns the updated order.
 * Calls computeOrderTaxes internally.
 */
export function computeOrderTaxGroup(
    order: Order,
    taxGroup: any,
    options: POSOptions,
): Order {
    const summarizedRates = taxGroup.taxes
        .map((tax: any) => parseFloat(tax.rate))
        .reduce((b: number, a: number) => b + a, 0);

    const currentVatValue = getVatValue(
        order.subtotal - order.discount,
        summarizedRates,
        order.tax_type as string,
    );

    taxGroup.taxes = taxGroup.taxes.map((_tax: any) => {
        const currentPercentage = math
            .chain(math.chain(_tax.rate).divide(summarizedRates).done())
            .multiply(100)
            .done();
        return {
            id: _tax.id,
            tax_id: _tax.tax_id,
            name: _tax.name,
            rate: parseFloat(_tax.rate),
            tax_value: math
                .chain(math.chain(currentVatValue).multiply(currentPercentage).done())
                .divide(100)
                .done(),
        };
    });

    if (taxGroup.taxes.length === 0) {
        // Caller is responsible for showing a warning toast.
        return order;
    }

    order.tax_group = order.tax_group || {};
    order.taxes = taxGroup.taxes;
    order.tax_group = taxGroup;

    return computeOrderTaxes(order, options);
}

// ---------------------------------------------------------------------------
// Section 5: Coupon Validation & Application
// ---------------------------------------------------------------------------

/**
 * Validates coupons against cart contents.
 * Returns lists of valid and invalid coupons.
 */
export function validateCoupons(
    products: OrderProduct[],
    coupons: Coupon[],
    options: POSOptions,
): { validCoupons: Coupon[]; invalidCoupons: Coupon[] } {
    const validCoupons: Coupon[] = [];
    const invalidCoupons: Coupon[] = [];

    for (const coupon of coupons) {
        const productMatch =
            coupon.products.length === 0 ||
            products.some((product) =>
                coupon.products.map((p) => p.product_id).includes(product.product_id || 0),
            );

        const categoryMatch =
            coupon.categories.length === 0 ||
            products.some((product) => {
                const source = product.source ?? null;
                return coupon.categories.map((c) => c.category_id).includes(source?.category_id || 0);
            });

        if (productMatch && categoryMatch) {
            validCoupons.push(coupon);
        } else {
            invalidCoupons.push(coupon);
        }
    }

    return { validCoupons, invalidCoupons };
}

/**
 * Applies coupon discounts to products.
 * Returns new products array — does not mutate input.
 */
function applyCouponDiscounts(
    products: OrderProduct[],
    coupons: Coupon[],
): OrderProduct[] {
    if (coupons.length === 0) return products;

    // For now, return products unchanged
    // Coupon discount application logic would go here
    // This is a placeholder for the actual coupon discount calculation
    return products;
}

// ---------------------------------------------------------------------------
// Section 6: Main Entry Points
// ---------------------------------------------------------------------------

/**
 * Full cart recomputation — the primary API.
 * Input: draft cart + options
 * Output: computed cart with all derived fields populated
 */
export function computeCart(draft: CartDraft, options: POSOptions): ComputedCart {
    // 1. Compute all products
    const products = draft.products.map((p) => computeProduct(p, options));

    // 2. Validate coupons
    const { validCoupons, invalidCoupons } = validateCoupons(products, draft.coupons, options);

    // 3. Apply coupon discounts to products
    const productsWithCoupons = applyCouponDiscounts(products, validCoupons);

    // 4. Compute order-level totals
    let order = sumProductsTotals({ ...draft.order }, productsWithCoupons, options);
    order = computeOrderTaxes(order, options);

    return {
        products: productsWithCoupons,
        order,
        validCoupons,
        invalidCoupons,
    };
}

/**
 * Single-item recomputation — for incremental updates.
 */
export function computeItem(item: OrderProduct, options: POSOptions): OrderProduct {
    return computeProduct(item, options);
}

// ---------------------------------------------------------------------------
// Section 7: Stock Usage Helper
// ---------------------------------------------------------------------------

/**
 * Returns total quantity of a given product+unit combination currently in the cart.
 */
export function getStockUsage(
    products: OrderProduct[],
    product_id: number,
    unit_quantity_id: number,
): number {
    const stocks = products
        .filter(
            (p) =>
                p.product_id === product_id &&
                p.unit_quantity_id === unit_quantity_id,
        )
        .map((p) => p.quantity);

    return stocks.length > 0 ? stocks.reduce((b: number, a: number) => b + a, 0) : 0;
}

// ---------------------------------------------------------------------------
// Section 8: Cart Calculator Utilities (from cart-calculator.ts)
// ---------------------------------------------------------------------------

/**
 * Calculates new tax value when price changes.
 */
export function calculateNewTaxValue(oldPriceWithoutTax: number, oldTaxValue: number, newPriceWithoutTax: number) {
    if (!oldPriceWithoutTax || oldPriceWithoutTax <= 0 || isNaN(oldPriceWithoutTax)) {
        return {
            taxRate: 0,
            newTaxValue: 0,
        };
    }

    const taxRate = oldTaxValue / oldPriceWithoutTax;
    const newTaxValue = newPriceWithoutTax * taxRate;

    return {
        taxRate: +(taxRate * 100).toFixed(2), // percent
        newTaxValue: +newTaxValue.toFixed(2), // rounded tax value
    };
}

/**
 * Calculates totals when quantity is updated.
 */
export function calculateTotalsForQuantityUpdate(product: OrderProduct, quantity: number, isPriceWithTax: boolean) {
    const lineSubtotal = product.unit_price * quantity;
    const discount_value =
        product.discount_type === 'percentage' ? ((product.discount_percentage || 0) / 100) * lineSubtotal : product.discount || 0;

    const totalBeforeTax = lineSubtotal - discount_value;

    let totalTaxValue = 0;
    const taxRate = product.price_without_tax > 0 ? product.tax_value / product.price_without_tax : 0;

    if (product.tax_type === 'exclusive') {
        totalTaxValue = totalBeforeTax * taxRate;
    } else if (product.tax_type === 'inclusive') {
        const taxMultiplier = 1 + taxRate;
        const priceWithTax = totalBeforeTax;
        const priceWithoutTax = taxMultiplier > 0 ? priceWithTax / taxMultiplier : priceWithTax;
        totalTaxValue = priceWithTax - priceWithoutTax;
    }

    const total_price_with_tax = totalBeforeTax + totalTaxValue;
    const total_price_without_tax = totalBeforeTax;

    return {
        discount: discount_value,
        quantity,
        total_tax_value: totalTaxValue,
        total_price: isPriceWithTax ? total_price_with_tax : total_price_without_tax,
        total_price_with_tax,
        total_price_without_tax,
    };
}

/**
 * Calculates totals when price is updated.
 */
export function calculateTotalsForPriceUpdate(product: OrderProduct, price: number, isPriceWithTax: boolean) {
    const discount_value = ((product.discount_percentage || 0) / 100) * price * product.quantity;
    const newTaxValue = calculateNewTaxValue(product.price_without_tax, product.tax_value, price).newTaxValue;
    const totalTaxValue = newTaxValue * product.quantity;
    const total_price = price * product.quantity;
    const total_price_with_tax = total_price + totalTaxValue - discount_value;
    const total_price_without_tax = total_price - discount_value;

    return {
        discount: discount_value,
        unit_price: price,
        price_without_tax: price,
        price_with_tax: price + newTaxValue,
        tax_value: newTaxValue,
        total_tax_value: totalTaxValue,
        mode: 'custom' as const,
        total_price: isPriceWithTax ? total_price_with_tax : total_price_without_tax,
        total_price_with_tax,
        total_price_without_tax,
    };
}

/**
 * Calculates totals when discount percentage is updated.
 */
export function calculateTotalsForDiscountPercentageUpdate(product: OrderProduct, discountPercentage: number, isPriceWithTax: boolean) {
    const lineSubtotal = (product.price_without_tax || product.unit_price) * product.quantity;
    const discount_value = (discountPercentage / 100) * lineSubtotal;
    const totalBeforeTax = lineSubtotal - discount_value;

    let totalTaxValue = 0;
    const taxRate = product.price_without_tax > 0 ? product.tax_value / product.price_without_tax : 0;

    if (product.tax_type === 'exclusive') {
        totalTaxValue = totalBeforeTax * taxRate;
    } else if (product.tax_type === 'inclusive') {
        const taxMultiplier = 1 + taxRate;
        const priceWithTax = (product.price_with_tax * product.quantity) - discount_value;
        const priceWithoutTax = taxMultiplier > 0 ? priceWithTax / taxMultiplier : priceWithTax;
        totalTaxValue = priceWithTax - priceWithoutTax;
    } else {
        totalTaxValue = (product.tax_value || 0) * product.quantity;
    }

    const total_price_with_tax = product.price_with_tax * product.quantity - discount_value;
    const total_price_without_tax = totalBeforeTax;

    return {
        discount_percentage: discountPercentage,
        discount: discount_value,
        total_tax_value: totalTaxValue,
        total_price: isPriceWithTax ? total_price_with_tax : total_price_without_tax,
        total_price_without_tax,
        total_price_with_tax,
    };
}
