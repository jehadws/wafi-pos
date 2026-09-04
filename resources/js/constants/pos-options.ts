/**
 * constants/pos-options.ts
 *
 * Central registry of POS option keys from the backend (SbPosOptions).
 * Use these instead of raw string literals to avoid silent typos.
 */

export const POS_OPTION_KEYS = {
    // Pricing & cart
    priceWithTax: 'sb_subul_price_with_tax',
    itemsMerge: 'sb_subul_items_merge',
    allowWholesalePrice: 'sb_subul_allow_wholesale_price',
    allowDecimalQuantities: 'sb_subul_allow_decimal_quantities',
    showQuantity: 'sb_subul_show_quantity',
    amountShortcut: 'sb_subul_amount_shortcut',

    // Tax
    taxType: 'sb_subul_tax_type',
    taxGroup: 'sb_subul_tax_group',

    // Order types
    orderTypes: 'sb_subul_order_types',

    // Audio
    newItemAudio: 'sb_subul_new_item_audio',
    completeSaleAudio: 'sb_subul_complete_sale_audio',

    // Orders policy
    allowPartial: 'sb_orders_allow_partial',
    allowUnpaid: 'sb_orders_allow_unpaid',

    // Customers
    defaultCustomer: 'sb_customers_default',

    // Cash registers
    registersEnabled: 'sb_subul_registers_enabled',
    idleCounter: 'sb_subul_idle_counter',
    disbursement: 'sb_subul_disbursement',
    registerChangePaymentType: 'sb_subul_registers_default_change_payment_type',

    // Layout
    layout: 'sb_subul_layout',

    // Printing
    printingEnabledFor: 'sb_subul_printing_enabled_for',
    printingDocument: 'sb_subul_printing_document',
    printingAuto: 'sb_subul_printing_auto',
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
