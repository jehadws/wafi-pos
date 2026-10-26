/**
 * hooks/pos/pos-store-types.ts
 *
 * Shared POSStore type used by the facade (usePOS.ts) and all slice factories.
 * Kept in a separate file so slices can type `get()` without circular imports.
 */

import type { PrintResult } from '@/services/printing-service';
import { Customer } from '@/types/models/customer';
import { Order } from '@/types/models/order';
import { OrderProduct } from '@/types/models/order-product';
import { OrderType } from '@/types/models/order-type';

import type { CartSlice } from './use-cart-store';
import type { CustomerSlice } from './use-customer-store';
import type { PaymentsSlice } from './use-payments-store';
import type { PosDialogsSlice } from './use-pos-dialogs';
import type { SessionSlice } from './use-pos-session';

/**
 * Slice ownership matrix — who writes what.
 *
 * | State                                 | Written by           | Read by         |
 * |---------------------------------------|----------------------|-----------------|
 * | order (+ isSubmitting/isRefreshing)   | facade orchestration | every slice, UI |
 * | products, autoMerge                   | cart slice           | facade, UI      |
 * | dialog open/close flags               | dialogs slice        | UI              |
 * | payments                              | payments slice       | facade, UI      |
 * | customer, coupons                     | customer slice       | facade, UI      |
 * | settings, options, types, permissions | session slice        | every slice, UI |
 *
 * Cross-slice reads go through get(); cross-slice WRITES go through the
 * owning slice's actions or facade orchestration. Known exception, do not
 * extend: use-pos-session.initialize() seeds order.tax_type/tax_group_id
 * before the cart is active (docs/agents/architecture.md → Store rules).
 */
export type POSStoreCoreState = {
  order: Order;
  isSubmitting: boolean;
  /** Guard: true while refreshCart is awaiting the tax API */
  isRefreshing: boolean;
  /** Set when refreshCart is called while a refresh is already in-flight */
  refreshPending: boolean;
  breadcrumbs: any[];
  customers: Customer[];
};

/** Store-level orchestration — not pure-function re-exports */
export type POSStoreOrchestration = {
  buildOrder: (order: Order) => void;
  buildProducts: (products: OrderProduct[]) => void;
  updateCart: (update: object) => void;
  refreshCart: () => Promise<void>;
  computeTaxes: () => Promise<any>;
  reset: () => Promise<void>;
  canProceedAsLaidAway: (order: Order) => Promise<any>;
  submitOrder: (orderFields?: object) => Promise<any>;
  proceedSubmitting: (order: Order) => Promise<any>;
  loadOrder: (order_id: number) => Promise<Order>;
  setDiscount: (value: number, type?: 'flat' | 'percentage') => void;
  setShipping: (value: number, shippingType?: string) => void;
  setNote: (note: string, visibility?: 'hidden' | 'visible') => void;
  /**
   * Applies the boot/reset default order type (single enabled type →
   * takeaway → first enabled) when the cart has none. Called on POS boot
   * (session initialize) and after reset().
   */
  applyDefaultOrderType: () => void;
  setOrderType: (type: OrderType) => void;
  updateAddress: (type: 'billing' | 'shipping', address: any) => void;
  printOrderReceipt: (order: Order, mode?: string, jobId?: string) => Promise<PrintResult | false>;
};

export type POSStore = POSStoreCoreState & PosDialogsSlice & CartSlice & PaymentsSlice & CustomerSlice & SessionSlice & POSStoreOrchestration;
