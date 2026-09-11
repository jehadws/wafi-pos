/**
 * services/express-checkout.ts
 *
 * Exact-cash express checkout: decides when a sale can be completed with a
 * single full cash payment without opening the payment screen, and builds
 * the payment entry for it.
 *
 * The express path goes through the same submitOrder + finalization pipeline
 * as the payment screen (validation, register stamping, receipt printing,
 * cash drawer, cart reset) — this module is purely decision + payload.
 */

import { Order } from '@/types/models/order';

export const EXACT_CASH_IDENTIFIER = 'cash-payment';

/**
 * True when the current cart can be completed with one exact cash payment:
 * non-empty cart, a positive total, no payments added yet and no tender
 * amount entered — i.e. nothing that requires the payment screen.
 */
export function canSubmitExactCash(order: Order, productCount: number): boolean {
  if (productCount <= 0) return false;
  if (!((order.total ?? 0) > 0)) return false; // zero-total needs the unpaid flow
  if ((order.payments?.length ?? 0) > 0) return false; // split tender in progress
  if ((order.tendered ?? 0) > 0) return false; // tender amount being entered / partial state
  return true;
}

/**
 * Builds the single full-value cash payment used by the express path.
 * `label` is translated by the caller (services stay React-free).
 */
export function buildExactCashPayment(total: number, label: string) {
  return {
    identifier: EXACT_CASH_IDENTIFIER,
    value: total,
    label,
    selected: false,
    readonly: false,
  };
}
