/**
 * services/pos-defaults.ts
 *
 * Pure helpers for POS checkout defaults: which order type a new cart
 * starts with, and which customer id represents the shop's walk-in account.
 *
 * Kept pure so the defaulting rules are unit-testable and reusable by any
 * entry point that boots the POS.
 */

import { isPosOptionEnabled, POS_OPTION_KEYS } from '@/constants/pos-options';

/** localStorage key holding the last order type used on this terminal. */
export const LAST_ORDER_TYPE_STORAGE_KEY = 'sb_pos_last_order_type';

/**
 * Picks the default order type identifier for a new cart:
 * last used on this terminal → the single enabled type → takeaway → first enabled.
 *
 * @param enabledTypes raw `sb_subul_order_types` value (expected: string[])
 * @param lastUsed     identifier persisted in localStorage, if any
 * @returns an enabled identifier, or null when no types are enabled
 */
export function pickDefaultOrderType(
    enabledTypes: unknown,
    lastUsed?: string | null,
): string | null {
    if (!Array.isArray(enabledTypes) || enabledTypes.length === 0) return null;

    if (lastUsed && enabledTypes.includes(lastUsed)) {
        return lastUsed;
    }

    if (enabledTypes.length === 1) {
        return enabledTypes[0] as string;
    }

    // Retail-first preference when the shop enables both types.
    if (enabledTypes.includes('takeaway')) return 'takeaway';

    return enabledTypes[0] as string;
}

/**
 * Resolves the configured walk-in / default customer id (`sb_customers_default`,
 * the "Default Customer Account" in the Customers settings). Returns null when
 * unset or invalid — in that case explicit customer selection stays required.
 */
export function resolveDefaultCustomerId(options: Record<string, any>): number | null {
    const raw = options?.[POS_OPTION_KEYS.defaultCustomer];
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * True when a scanned product can be added straight to the cart with the
 * default quantity (1): the "Show Quantity" setting (sb_subul_show_quantity)
 * is off — meaning "use the default quantity" per its description — and the
 * barcode lookup resolved which unit quantity to use.
 */
export function canAddBarcodeSilently(options: Record<string, any>, product: any): boolean {
    if (isPosOptionEnabled(options, POS_OPTION_KEYS.showQuantity)) return false;
    return Boolean(product?.product?.selectedUnitQuantity);
}
