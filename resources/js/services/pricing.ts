/**
 * services/pricing.ts
 *
 * Pure, stateless pricing helpers.
 * No Zustand, no side-effects — data in, data out.
 *
 * Extracted from usePOS.ts:
 *   getSalePrice, getCustomPrice, getWholesalePrice,
 *   getPrice, getProductUnitPrice, sumProductsTotals
 */

import { Order } from '@/types/models/order';
import { OrderProduct } from '@/types/models/order-product';
import { ProductUnitQuantity } from '@/types/models/product-unit-quantity';
import { sumProductsTaxes } from '@/services/tax';
import { rawCurrency } from '@/utils/format';

/**
 * Returns the unit sale price for a product quantity entry,
 * respecting the ns_jgrem_price_with_tax option.
 */
export function getSalePrice(
    item: ProductUnitQuantity | undefined,
    options: Record<string, any>,
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
export function getCustomPrice(item: any, options: Record<string, any>): number {
    if (options.ns_jgrem_price_with_tax === 'yes') {
        return rawCurrency(item.custom_price_with_tax);
    }
    return rawCurrency(item.custom_price_without_tax);
}

/**
 * Returns the wholesale unit price for a product quantity entry,
 * respecting the ns_jgrem_price_with_tax option.
 */
export function getWholesalePrice(item: any, options: Record<string, any>): number {
    if (options.ns_jgrem_price_with_tax === 'yes') {
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

/**
 * Computes order.subtotal from the given products array and delegates
 * per-product tax aggregation to sumProductsTaxes.
 */
export function sumProductsTotals(
    order: Order,
    products: OrderProduct[],
    options: Record<string, any>,
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
