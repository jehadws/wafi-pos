/**
 * hooks/pos/pos-store-types.ts
 *
 * Shared POSStore type used by the facade (usePOS.ts) and all slice factories.
 * Kept in a separate file so slices can type `get()` without circular imports.
 */

import { Customer } from '@/types/models/customer';
import { Order } from '@/types/models/order';
import { OrderProduct } from '@/types/models/order-product';
import { OrderType } from '@/types/models/order-type';
import type { PrintResult } from '@/services/print-agent-service';

import type { PosDialogsSlice } from './use-pos-dialogs';
import type { CartSlice } from './use-cart-store';
import type { PaymentsSlice } from './use-payments-store';
import type { CustomerSlice } from './use-customer-store';
import type { SessionSlice } from './use-pos-session';

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
    setOrderType: (type: OrderType) => void;
    updateAddress: (type: 'billing' | 'shipping', address: any) => void;
    printOrderReceipt: (order: Order, mode?: string) => Promise<PrintResult | false>;
};

export type POSStore = POSStoreCoreState &
    PosDialogsSlice &
    CartSlice &
    PaymentsSlice &
    CustomerSlice &
    SessionSlice &
    POSStoreOrchestration;
