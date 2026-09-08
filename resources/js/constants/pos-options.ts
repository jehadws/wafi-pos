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
    vat: 'sb_subul_vat',

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

    // Quick product creation
    quickProduct: 'sb_subul_quick_product',
    quickProductDefaultUnit: 'sb_subul_quick_product_default_unit',

    // Layout & catalog behavior
    forceAutofocus: 'sb_subul_force_autofocus',
    hideEmptyCategories: 'sb_subul_hide_empty_categories',
    hideExhaustedProducts: 'sb_subul_hide_exhausted_products',
    numpad: 'sb_subul_numpad',
    // NOTE: the backend key carries the "ediable" spelling — keep verbatim.
    unitPriceEditable: 'sb_subul_unit_price_ediable',

    // Printing gateway
    printingGateway: 'sb_subul_printing_gateway',

    // Keyboard shortcuts
    keyboardCancelOrder: 'sb_subul_keyboard_cancel_order',
    keyboardCreateCustomer: 'sb_subul_keyboard_create_customer',
    keyboardFullscreen: 'sb_subul_keyboard_fullscreen',
    keyboardHoldOrder: 'sb_subul_keyboard_hold_order',
    keyboardNote: 'sb_subul_keyboard_note',
    keyboardOrderType: 'sb_subul_keyboard_order_type',
    keyboardPayment: 'sb_subul_keyboard_payment',
    keyboardQuickSearch: 'sb_subul_keyboard_quick_search',
    keyboardShipping: 'sb_subul_keyboard_shipping',
    keyboardShortcuts: 'sb_subul_keyboard_shortcuts',
    keyboardToggleMerge: 'sb_subul_keyboard_toggle_merge',
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
export function isPriceWithTax(options: object): boolean {
    return (options as Record<string, unknown>)[POS_OPTION_KEYS.priceWithTax] === 'yes';
}

/**
 * Returns true when the global VAT mode is disabled ("Disabled" in
 * POS Settings → VAT). When disabled, no tax is computed anywhere and
 * products sell at their merchant-entered price — regardless of any
 * per-product tax group left on the catalog.
 */
export function isVatDisabled(options: object): boolean {
    return (options as Record<string, unknown>)[POS_OPTION_KEYS.vat] === 'disabled';
}

/** Minimal unit-quantity shape the price resolver needs. */
export interface UnitDisplayPriceSource {
    sale_price_edit?: number;
    sale_price_with_tax?: number;
    sale_price_without_tax?: number;
}

/**
 * Resolves the price a catalog surface (grid tile, unit picker, search
 * dialog) should display for a unit quantity — using the exact same rules
 * the cart engine charges by:
 * - VAT disabled → the merchant-entered (edit) price (with/without collapse).
 * - Otherwise → with-tax or without-tax per "Show Price With Tax".
 *
 * Never read `sale_price` directly: the backend aliases it to the with-tax
 * price for BOTH tax types (TaxService::computeTax), which is how catalog
 * tiles ended up disagreeing with the cart.
 */
export function resolveUnitDisplayPrice(
    unit: UnitDisplayPriceSource | undefined | null,
    options: object,
): number {
    if (!unit) return 0;

    if (isVatDisabled(options)) {
        return unit.sale_price_edit || unit.sale_price_without_tax || 0;
    }

    return isPriceWithTax(options)
        ? (unit.sale_price_with_tax ?? 0)
        : (unit.sale_price_without_tax ?? 0);
}
