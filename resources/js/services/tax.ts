/**
 * services/tax.ts
 *
 * Pure, stateless tax-computation helpers.
 * No Zustand, no side-effects — data in, data out.
 *
 * Merges:
 *  - libraries/tax.ts  (Tax static class)
 *  - usePOS.ts         (getPriceWithoutTax, getPriceWithTax, getVatValue,
 *                       computeTaxForGroup, computeOrderTaxGroup,
 *                       computeOrderTaxes, sumProductsTaxes,
 *                       computeProductTax*, proceedProductTaxComputation,
 *                       computeProductTaxValue)
 */

import { Order } from '@/interfaces/order';
import { OrderProduct } from '@/interfaces/order-product';
import * as math from 'mathjs';

// ---------------------------------------------------------------------------
// 1. Primitive tax math  (previously libraries/tax.ts)
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
 * Kept for any remaining `import Tax from '@/libraries/tax'` call-sites.
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

export default Tax;

// ---------------------------------------------------------------------------
// 2. Price-level helpers  (previously inline in usePOS)
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
// 3. Order-level tax computation
// ---------------------------------------------------------------------------

/**
 * Distributes a tax group's VAT across its sub-taxes and returns the updated order.
 * Calls computeOrderTaxes internally.
 */
export function computeOrderTaxGroup(
    order: Order,
    taxGroup: any,
    options: Record<string, any>,
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
 * Accumulates order-level taxes from order.taxes into order.tax_value
 * depending on the POS VAT mode stored in options.
 */
export function computeOrderTaxes(order: Order, options: Record<string, any>): Order {
    const posVat = options.ns_jgrem_vat;

    if (['flat_vat', 'variable_vat'].includes(posVat) && order.taxes && order.taxes.length > 0) {
        order.tax_value += order.taxes
            .map((tax: any) => tax.tax_value)
            .reduce((before: number, after: number) => before + after);
    }

    return order;
}

/**
 * Sums per-product taxes into the order and updates order.subtotal
 * for products_vat mode.
 */
export function sumProductsTaxes(
    order: Order,
    products: OrderProduct[],
    options: Record<string, any>,
): Order {
    const posVat = options.ns_jgrem_vat;

    order.products = products as any;
    order.total_products = products.length;

    if (['products_vat'].includes(posVat)) {
        const totalTaxValues = products.map((p: OrderProduct) => p.total_tax_value);
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

// ---------------------------------------------------------------------------
// 4. Product-level tax computation
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
    const originalProduct = product.$original();
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
 * Computes and mutates all tax + price fields on a product using its current
 * mode and quantities. Main entry-point for single-product tax refresh.
 */
export function computeProductTaxValue(product: OrderProduct): void {
    const tax_group = product.$original().tax_group;
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
// 5. Tax-group aggregation helper
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
