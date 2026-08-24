/**
 * services/order-builder.ts
 *
 * Pure order-assembly helpers.
 * No Zustand — every function receives its dependencies as parameters.
 *
 * Extracted from usePOS.ts:
 *   computeProduct, recomputeProducts, defineQuantities, getStockUsage
 */

import { OrderProduct } from '@/types/models/order-product';
import { taxesApi } from '@/api';
import {
    computeProductTaxValue,
    getVatValue,
} from '@/services/tax';
import { getSalePrice, getWholesalePrice } from '@/services/pricing';
import * as math from 'mathjs';

// ---------------------------------------------------------------------------
// defineQuantities
// ---------------------------------------------------------------------------

/**
 * Builds a normalised quantities object for a product loaded from an order.
 * If the product has a tax group, the API is called to compute tax splits.
 *
 * @param product  - Raw order product (from API)
 * @param units    - Available units array (for resolving unit name)
 */
export async function defineQuantities(
    product: any,
    units: any[] = [],
): Promise<any> {
    const unit = units.filter((u) => u.id === product.unit_id);

    const quantities: any = {
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
// getStockUsage
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
// computeProduct / recomputeProducts
// ---------------------------------------------------------------------------

/**
 * Computes all derived fields (unit_price, total_price, tax fields) on a
 * single cart product. Returns a new object — never mutates the input.
 *
 * @param product  - The cart product to compute
 * @param options  - POS options (ns_jgrem_price_with_tax, etc.)
 */
export function computeProduct(product: OrderProduct, options: Record<string, any>): OrderProduct {
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
 * Returns a new array — never mutates the input.
 */
export function recomputeProducts(
    products: OrderProduct[],
    options: Record<string, any>,
): OrderProduct[] {
    return products.map((product) => computeProduct(product, options));
}
