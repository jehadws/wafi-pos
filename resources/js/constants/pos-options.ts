/**
 * constants/pos-options.ts
 *
 * Central registry of POS option keys from the backend (NsPosOptions).
 * Use these instead of raw string literals to avoid silent typos.
 */

export const POS_OPTION_KEYS = {
    // Pricing & cart
    priceWithTax: 'ns_jgrem_price_with_tax',
    itemsMerge: 'ns_jgrem_items_merge',
    allowWholesalePrice: 'ns_jgrem_allow_wholesale_price',
    allowDecimalQuantities: 'ns_jgrem_allow_decimal_quantities',
    showQuantity: 'ns_jgrem_show_quantity',
    amountShortcut: 'ns_jgrem_amount_shortcut',

    // Tax
    taxType: 'ns_jgrem_tax_type',
    taxGroup: 'ns_jgrem_tax_group',

    // Order types
    orderTypes: 'ns_jgrem_order_types',

    // Audio
    newItemAudio: 'ns_jgrem_new_item_audio',
    completeSaleAudio: 'ns_jgrem_complete_sale_audio',

    // Orders policy
    allowPartial: 'ns_orders_allow_partial',
    allowUnpaid: 'ns_orders_allow_unpaid',

    // Customers
    defaultCustomer: 'ns_customers_default',

    // Printing
    printingEnabledFor: 'ns_jgrem_printing_enabled_for',
    printingAuto: 'ns_jgrem_printing_auto',
} as const;

export type PosOptionKey = (typeof POS_OPTION_KEYS)[keyof typeof POS_OPTION_KEYS];

/** Read a POS option value with a typed key */
export function getPosOption<K extends PosOptionKey>(
    options: Record<string, unknown>,
    key: K,
): unknown {
    return options[key];
}

/** Returns true when the option is explicitly enabled ('yes' or truthy boolean) */
export function isPosOptionEnabled(
    options: Record<string, unknown>,
    key: PosOptionKey,
): boolean {
    const value = options[key];
    return value === 'yes' || value === true;
}

/** Returns true when price-with-tax mode is active */
export function isPriceWithTax(options: Record<string, unknown>): boolean {
    return options[POS_OPTION_KEYS.priceWithTax] === 'yes';
}
