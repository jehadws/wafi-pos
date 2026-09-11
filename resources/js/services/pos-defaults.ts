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

/**
 * Picks the default order type identifier for a new cart:
 * the single enabled type → takeaway → first enabled.
 *
 * With both types active, takeaway is the retail-first default; with only one
 * type enabled, that type is always the default. Nothing is persisted: every
 * POS page load starts from this deterministic default.
 *
 * @param enabledTypes raw `sb_subul_order_types` value (expected: string[])
 * @returns an enabled identifier, or null when no types are enabled
 */
export function pickDefaultOrderType(enabledTypes: unknown): string | null {
  if (!Array.isArray(enabledTypes) || enabledTypes.length === 0) return null;

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
