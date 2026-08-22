/**
 * services/cart-engine.ts
 *
 * Single consolidation point for all cart & pricing math.
 * Absorbs the former:
 *   - services/tax.ts             → primitive + order/product tax math
 *   - services/pricing.ts         → mode-aware price getters + order totals
 *   - services/order-builder.ts   → product computation, quantities, stock usage
 *   - services/cart-calculator.ts → line-update calculators (qty/price/discount)
 *
 * Tax-semantics note (deliberate):
 *   The line-update calculators (`calculateTotalsFor*`) intentionally keep the
 *   ratio-based approach (`tax_value / price_without_tax`, rounded to 2 dp) that
 *   cart-calculator.ts always used, while the group/rate functions keep the
 *   mathjs rate-formula approach from tax.ts. Consumers use each family for a
 *   different purpose — do not cross-wire them without re-pinning golden values.
 *
 * Mutation note (deliberate, matches previous behavior):
 *   Order-level functions (`sumProductsTotals`, `computeOrderTaxGroup`,
 *   `computeOrderTaxes`) mutate the order object passed in, exactly as their
 *   predecessors did — callers must pass a fresh copy (`{ ...order }`).
 *   Product-level `computeProduct` returns a new object and never writes to
 *   its input. Replacing the `$quantities`/`$original` closures with
 *   serializable data is planned as a follow-up phase (see
 *   cart-engine-plan-validation.md).
 *
 * Pure domain layer: no Zustand, no React, no DOM.
 */

import { taxesApi } from '@/api';
import { Coupon } from '@/types/models/coupon';
import { Order } from '@/types/models/order';
import { OrderProduct } from '@/types/models/order-product';
import { ProductUnitQuantity } from '@/types/models/product-unit-quantity';
import type { CartDraft, ComputedCart, POSOptions } from '@/types/cart-engine';
import { rawCurrency } from '@/utils/format';
import * as math from 'mathjs';

// ---------------------------------------------------------------------------
// 1. Primitive tax math
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
 * @deprecated Use the named exports above instead.
 * Kept as a compatibility shim for any remaining `Tax.compute(...)` call-sites.
 */
export class Tax {
    static compute(type: string, value: number, rate: number): number | undefined {
        switch (type) {
            case 'inclusive':
                return computeInclusive(value, rate);
            case 'exclusive':
                return computeExclusive(value, rate);
        }
    }
    static computeInclusive = computeInclusive;
    static computeExclusive = computeExclusive;
    static getTaxValue = getTaxValue;
}

// ---------------------------------------------------------------------------
// 2. Price-level helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 3. Mode-aware pricing getters
// ---------------------------------------------------------------------------

/**
 * Returns the unit sale price for a product quantity entry,
 * respecting the ns_jgrem_price_with_tax option.
 */
export function getSalePrice(
    item: ProductUnitQuantity | undefined,
    options: POSOptions,
): number {
    if (options.ns_jgrem_price_with_tax === 'yes') {
        return rawCurrency(item?.sale_price_with_tax);
    }
    return rawCurrency(item?.sale_price_without_tax);
}

/**
 * Returns the custom unit price for a product quantity entry,
 * respecting the ns_jgrem_price_with_tax option.
 */
export function getCustomPrice(item: Record<string, any>, options: POSOptions): number {
    if (options.ns_jgrem_price_with_tax === 'yes') {
        return rawCurrency(item.custom_price_with_tax);
    }
    return rawCurrency(item.custom_price_without_tax);
}

/**
 * Returns the wholesale unit price for a product quantity entry,
 * respecting the ns_jgrem_price_with_tax option.
 */
export function getWholesalePrice(item: Record<string, any>, options: POSOptions): number {
    if (options.ns_jgrem_price_with_tax === 'yes') {
        return rawCurrency(item.wholesale_price_with_tax);
    }
    return rawCurrency(item.wholesale_price_without_tax);
}

/**
 * Returns a specific price value from a quantities object by mode + type suffix.
 * e.g. getPrice(quantities, 'normal', 'with_tax') → quantities.sale_price_with_tax
 */
export function getPrice(quantities: Record<string, any>, mode: string, type: string): number {
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
export function getProductUnitPrice(mode: string, quantities: Record<string, any>): number {
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
// 4. Tax-group aggregation
// ---------------------------------------------------------------------------

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
// 5. Product-level tax computation
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
export function proceedProductTaxComputation(
    product: OrderProduct,
    price: number,
): TaxComputationResult {
    // Call-sites always attach $original (addToCart / loadOrder); the
    // non-null assertion keeps runtime behavior identical to the legacy code.
    const originalProduct = product.$original!();
    const taxGroup = originalProduct.tax_group;

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

        const result = computeTaxForGroup(lineAfterDiscount, taxGroup, originalProduct.tax_type);

        total_tax_value = result.tax_value;
        tax_value = math.chain(total_tax_value).divide(product.quantity).done();
        price_with_tax = math.chain(result.price_with_tax).divide(product.quantity).done();
        price_without_tax = math.chain(result.price_without_tax).divide(product.quantity).done();
    }

    return { price_without_tax, tax_value, price_with_tax, total_tax_value };
}

/**
 * Computes and mutates tax fields on a custom-priced product.
 */
export function computeCustomProductTax(product: OrderProduct): OrderProduct {
    const quantities = product.$quantities?.();
    if (!quantities) return product;

    const result = proceedProductTaxComputation(product, quantities.custom_price_edit);

    quantities.custom_price_without_tax = result.price_without_tax;
    quantities.custom_price_with_tax = result.price_with_tax;
    quantities.custom_price_tax = result.tax_value;
    product.tax_value = result.tax_value;
    product.total_tax_value = result.total_tax_value;
    product.$quantities = () => quantities;

    return product;
}

/**
 * Computes and mutates tax fields on a normal-priced product.
 */
export function computeNormalProductTax(product: OrderProduct): OrderProduct {
    const quantities = product.$quantities?.();
    if (!quantities) return product;

    const result = proceedProductTaxComputation(product, quantities.sale_price_edit);

    quantities.sale_price_without_tax = result.price_without_tax;
    quantities.sale_price_with_tax = result.price_with_tax;
    quantities.sale_price_tax = result.tax_value;
    product.tax_value = result.tax_value;
    product.total_tax_value = result.total_tax_value;
    product.$quantities = () => quantities;

    return product;
}

/**
 * Computes and mutates tax fields on a wholesale-priced product.
 */
export function computeWholesaleProductTax(product: OrderProduct): OrderProduct {
    const quantities = product.$quantities?.();
    if (!quantities) return product;

    const result = proceedProductTaxComputation(product, quantities.wholesale_price_edit);

    quantities.wholesale_price_without_tax = result.price_without_tax;
    quantities.wholesale_price_with_tax = result.price_with_tax;
    quantities.wholesale_price_tax = result.tax_value;
    product.tax_value = result.tax_value;
    product.total_tax_value = result.total_tax_value;
    product.$quantities = () => quantities;

    return product;
}

/**
 * Dispatches to the correct per-mode tax computation function.
 */
export function computeProductTax(product: OrderProduct): OrderProduct {
    switch (product.mode) {
        case 'custom':
            return computeCustomProductTax(product);
        case 'normal':
            return computeNormalProductTax(product);
        case 'wholesale':
            return computeWholesaleProductTax(product);
        default:
            return product;
    }
}

/**
 * Computes all tax + price fields on a product using its current
 * mode and quantities. Main entry-point for single-product tax refresh.
 * Writes only to the passed product object.
 */
export function computeProductTaxValue(product: OrderProduct): void {
    const tax_group = product.$original!().tax_group;
    let unitPrice: number;

    if (product.mode === 'normal') {
        unitPrice =
            product.tax_type === 'inclusive'
                ? (product.$quantities?.().sale_price_with_tax ?? 0)
                : (product.$quantities?.().sale_price_without_tax ?? 0);
    } else if (product.mode === 'wholesale') {
        unitPrice =
            product.tax_type === 'inclusive'
                ? (product.$quantities?.().wholesale_price_with_tax ?? 0)
                : (product.$quantities?.().wholesale_price_without_tax ?? 0);
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

// ---------------------------------------------------------------------------
// 6. Product computation (order-builder core)
// ---------------------------------------------------------------------------

/**
 * Computes all derived fields (unit_price, total_price, tax fields) on a
 * single cart product. Returns a new object — never writes to the input.
 *
 * @param product  - The cart product to compute
 * @param options  - POS options (ns_jgrem_price_with_tax, etc.)
 */
export function computeProduct(product: OrderProduct, options: POSOptions): OrderProduct {
    const computed: OrderProduct = { ...product };

    if (computed.product_type === 'product') {
        if (computed.mode === 'normal' && computed.$quantities) {
            computed.unit_price = getSalePrice(computed.$quantities(), options);
        } else if (computed.mode === 'wholesale' && computed.$quantities) {
            computed.unit_price = getWholesalePrice(computed.$quantities(), options);
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
 * Returns a new array of new objects — never writes to the inputs.
 */
export function recomputeProducts(
    products: OrderProduct[],
    options: POSOptions,
): OrderProduct[] {
    return products.map((product) => computeProduct(product, options));
}

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
// 7. Quantities definition (async — may hit the taxes API)
// ---------------------------------------------------------------------------

/**
 * Builds a normalised quantities object for a product loaded from an order.
 * If the product has a tax group, the API is called to compute tax splits.
 *
 * @param product  - Raw order product (from API)
 * @param units    - Available units array (for resolving unit name)
 */
export async function defineQuantities(
    product: Record<string, any>,
    units: Array<Record<string, any>> = [],
): Promise<Record<string, any>> {
    const unit = units.filter((u) => u.id === product.unit_id);

    const quantities: Record<string, any> = {
        unit: unit[0] || {},
        sale_price_with_tax: product.mode === 'normal' ? parseFloat(product.price_with_tax) : 0,
        sale_price_without_tax: product.mode === 'normal' ? parseFloat(product.price_without_tax) : 0,
        sale_price: product.mode === 'normal' ? parseFloat(product.unit_price) : 0,
        sale_price_tax: product.mode === 'normal' ? product.tax_value : 0,
        sale_price_edit: 0,
        wholesale_price_with_tax: product.mode === 'wholesale' ? parseFloat(product.price_with_tax) : 0,
        wholesale_price_without_tax: product.mode === 'wholesale' ? parseFloat(product.price_without_tax) : 0,
        wholesale_price: product.mode === 'wholesale' ? parseFloat(product.unit_price) : 0,
        wholesale_price_tax: product.mode === 'wholesale' ? product.tax_value : 0,
        wholesale_price_edit: 0,
        custom_price_with_tax: product.mode === 'custom' ? parseFloat(product.price_with_tax) : 0,
        custom_price_without_tax: product.mode === 'custom' ? parseFloat(product.price_without_tax) : 0,
        custom_price: product.mode === 'custom' ? parseFloat(product.unit_price) : 0,
        custom_price_tax: product.mode === 'custom' ? product.tax_value : 0,
        custom_price_edit: product.mode === 'custom' ? parseFloat(product.unit_price) : 0,
    };

    if (['inclusive', 'exclusive'].includes(product.tax_type)) {
        if (product.tax_group_id) {
            const taxGroup = await taxesApi.getGroup(product.tax_group_id);
            ['sale', 'wholesale', 'custom'].forEach((label) => {
                quantities[label + '_price_tax'] = taxGroup.taxes
                    .map((tax: any) =>
                        getVatValue(quantities[label + '_price'], tax.rate, product.tax_type),
                    )
                    .reduce((b: number, a: number) => b + a, 0);
                quantities['gross_' + label + '_price'] =
                    quantities[label + '_price'] + quantities[label + '_price_tax'];
                quantities['net_' + label + '_price'] =
                    quantities[label + '_price'] - quantities[label + '_price_tax'];
            });
            return quantities;
        } else {
            quantities.sale_price_tax = 0;
            quantities.wholesale_price_tax = 0;
            quantities.sale_price_without_tax = product.unit_price;
            return quantities;
        }
    }

    return quantities;
}

// ---------------------------------------------------------------------------
// 8. Order-level totals & taxes
// ---------------------------------------------------------------------------

/**
 * Accumulates order-level taxes from order.taxes into order.tax_value
 * depending on the POS VAT mode stored in options.
 * NOTE: mutates (and returns) the passed order — pass a copy.
 */
export function computeOrderTaxes(order: Order, options: POSOptions): Order {
    // Assertion only satisfies strictNullChecks — runtime is unchanged.
    const posVat = options.ns_jgrem_vat as string;

    if (
        ['flat_vat', 'variable_vat'].includes(posVat) &&
        order.taxes &&
        order.taxes.length > 0
    ) {
        order.tax_value += order.taxes
            .map((tax: any) => tax.tax_value)
            .reduce((before: number, after: number) => before + after);
    }

    return order;
}

/**
 * Distributes a tax group's VAT across its sub-taxes and returns the updated order.
 * Calls computeOrderTaxes internally.
 * NOTE: mutates (and returns) the passed order/taxGroup — pass copies.
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

/**
 * Sums per-product taxes into the order and updates order.subtotal
 * for products_vat mode.
 * NOTE: mutates (and returns) the passed order — pass a copy.
 */
export function sumProductsTaxes(
    order: Order,
    products: OrderProduct[],
    options: POSOptions,
): Order {
    // Assertion only satisfies strictNullChecks — runtime is unchanged.
    const posVat = options.ns_jgrem_vat as string;

    order.products = products as any;
    order.total_products = products.length;

    if (['products_vat'].includes(posVat)) {
        // Assertion keeps runtime identical when a line lacks total_tax_value.
        const totalTaxValues = products.map((p: OrderProduct) => p.total_tax_value as number);
        if (totalTaxValues.length > 0) {
            order.products_tax_value = totalTaxValues.reduce(
                (before: number, after: number) => before + after,
            );
        }
    }

    if (options.ns_jgrem_price_with_tax === 'no') {
        order.subtotal = math.chain(order.subtotal).add(order.products_tax_value).done();
    }

    return order;
}

/**
 * Computes order.subtotal from the given products array and delegates
 * per-product tax aggregation to sumProductsTaxes.
 * NOTE: mutates dynamic products' derived fields and the passed order —
 * callers pass a fresh order copy.
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

// ---------------------------------------------------------------------------
// 9. Line-update calculators (quantity / price / discount edits)
// ---------------------------------------------------------------------------

/**
 * Projects a new tax value proportionally from an old price/tax pair.
 * Used when the user manually overrides a line price.
 */
export function calculateNewTaxValue(
    oldPriceWithoutTax: number,
    oldTaxValue: number,
    newPriceWithoutTax: number,
) {
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
 * Recomputes line totals after a quantity change.
 * Pure: returns a partial patch to merge onto the product.
 */
export function calculateTotalsForQuantityUpdate(
    product: OrderProduct,
    quantity: number,
    isPriceWithTax: boolean,
) {
    const lineSubtotal = product.unit_price * quantity;
    const discount_value =
        product.discount_type === 'percentage'
            ? ((product.discount_percentage || 0) / 100) * lineSubtotal
            : product.discount || 0;

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
 * Recomputes line totals after a manual price edit (switches mode to 'custom').
 * Pure: returns a partial patch to merge onto the product.
 */
export function calculateTotalsForPriceUpdate(
    product: OrderProduct,
    price: number,
    isPriceWithTax: boolean,
) {
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
 * Recomputes line totals after a percentage-discount change.
 * Pure: returns a partial patch to merge onto the product.
 */
export function calculateTotalsForDiscountPercentageUpdate(
    product: OrderProduct,
    discountPercentage: number,
    isPriceWithTax: boolean,
) {
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

// ---------------------------------------------------------------------------
// 10. Coupons
// ---------------------------------------------------------------------------

/**
 * Sums the discount contribution of every coupon against a subtotal.
 * Mirrors the historical refreshCart() inline computation:
 * percentage coupons scale with the subtotal, flat ones apply as-is.
 */
export function computeCouponTotal(coupons: Coupon[], subtotal: number): number {
    const totalValue = coupons.map((coupon) => {
        if (coupon.type === 'percentage_discount') {
            return (subtotal * (coupon.discount_value ?? 0)) / 100;
        }
        return coupon.discount_value ?? 0;
    });

    return totalValue.length > 0 ? totalValue.reduce((b: number, a: number) => b + a, 0) : 0;
}

/**
 * Splits coupons into still-valid vs no-longer-applicable, based on the
 * product/category constraints of each coupon matched against the cart.
 *
 * A coupon is invalid when it requires specific products (or categories)
 * and none of them are present in the cart. Coupons without constraints
 * are always valid.
 */
export function validateCoupons(
    coupons: Coupon[],
    products: OrderProduct[],
): { validCoupons: Coupon[]; invalidCoupons: Coupon[] } {
    const validCoupons: Coupon[] = [];
    const invalidCoupons: Coupon[] = [];

    coupons.forEach((coupon) => {
        const productsRequired = (coupon.products?.length ?? 0) > 0;
        const categoriesRequired = (coupon.categories?.length ?? 0) > 0;

        const productMatch =
            !productsRequired ||
            products.some((product) =>
                coupon.products!.some((cp) => cp.product_id === product.product_id),
            );

        const categoryMatch =
            !categoriesRequired ||
            products.some((product) =>
                coupon.categories!.some(
                    (cc) => cc.category_id === product.$original?.()?.category_id,
                ),
            );

        if (productMatch && categoryMatch) {
            validCoupons.push(coupon);
        } else {
            invalidCoupons.push(coupon);
        }
    });

    return { validCoupons, invalidCoupons };
}

// ---------------------------------------------------------------------------
// 11. Facade
// ---------------------------------------------------------------------------

/**
 * Facade over the cart pipeline. Every member is also exported standalone
 * above; the object form exists so consumers can depend on a single symbol.
 */
export const CartEngine = {
    /**
     * Sync, deterministic full-cart computation:
     * recomputes every line, derives subtotal/tax aggregates, applies coupon
     * totals + order discounts (with subtotal cap), resets the server-computed
     * tax_value, and splits coupons into valid/invalid.
     *
     * Does NOT mutate draft.products or draft.order. The async server-side
     * tax round-trip (computeTaxes) stays with the caller.
     */
    computeCart(draft: CartDraft, options: POSOptions): ComputedCart {
        // 1. Recompute every line (new objects; inputs untouched)
        const products = recomputeProducts(draft.products, options);

        // 2. Subtotal + per-product tax aggregation (operates on an order copy)
        let order = sumProductsTotals({ ...draft.order }, products, options);

        // 3. Split coupons into still-valid vs no-longer-applicable. In the
        //    production flow invalid coupons are removed before totals are
        //    computed (checkCart runs first), so only valid ones contribute.
        const coupons = draft.coupons ?? [];
        const { validCoupons, invalidCoupons } = validateCoupons(coupons, products);

        // 4. Coupon totals (valid coupons only — mirrors the production flow)
        order = { ...order, total_coupons: computeCouponTotal(validCoupons, order.subtotal) };

        // 5. Percentage order discount
        if (order.discount_type === 'percentage') {
            order = { ...order, discount: (order.discount_percentage * order.subtotal) / 100 };
        }

        // 6. Cap flat discount at subtotal when no coupons absorb the rest
        if (order.discount > order.subtotal && order.total_coupons === 0) {
            order = { ...order, discount: order.subtotal };
        }

        // 7. Reset order-level tax — the server-side computeTaxes() repopulates it
        order = { ...order, tax_value: 0 };

        return { products, order, validCoupons, invalidCoupons };
    },

    /** Single-product recompute used by cart mutations. Returns a new object. */
    computeItem(item: OrderProduct, options: POSOptions): OrderProduct {
        return computeProduct(item, options);
    },

    /** Async: resolves a loaded order product's quantities (may hit taxes API). */
    defineQuantities,

    recomputeProducts,
    computeProduct,
    sumProductsTotals,
    sumProductsTaxes,
    computeOrderTaxes,
    computeOrderTaxGroup,
    calculateNewTaxValue,
    calculateTotalsForQuantityUpdate,
    calculateTotalsForPriceUpdate,
    calculateTotalsForDiscountPercentageUpdate,
    getStockUsage,
    validateCoupons,
    computeCouponTotal,
    computeInclusive,
    computeExclusive,
    getTaxValue,
    getVatValue,
    getPriceWithoutTax,
    getPriceWithTax,
};