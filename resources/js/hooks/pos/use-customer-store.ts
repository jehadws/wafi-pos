/**
 * hooks/pos/use-customer-store.ts
 *
 * Zustand slice — customer & coupon state management.
 *
 * Extracted from usePOS.ts:
 *   selectCustomer, loadCustomer, pushCoupon, removeCoupon
 */

import { Customer } from '@/types/models/customer';
import { customersApi } from '@/api';
import type { POSStore } from './pos-store-types';
import { StateCreator } from 'zustand';
import { toast } from 'sonner';


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomerSliceActions {
    selectCustomer: (customer: Customer) => Promise<any>;
    loadCustomer: (id: number) => Promise<any>;
    pushCoupon: (coupon: any) => void;
    removeCoupon: (coupon: any) => void;
}

export type CustomerSlice = CustomerSliceActions;

// ---------------------------------------------------------------------------
// Slice factory
// ---------------------------------------------------------------------------

export const createCustomerSlice: StateCreator<POSStore, [], [], CustomerSlice> = (set, get) => ({
    selectCustomer: async (customer) => {
        const { order } = get();
        const billing = { ...(customer.billing || {}) };

        if (billing.id !== undefined) {
            delete billing.id;
        }

        const newOrder = {
            ...order,
            customer,
            customer_id: customer.id,
            addresses: { ...order.addresses, billing },
        };

        set({ order: newOrder });

        if (customer.group === undefined || customer.group === null) {
            const group = await customersApi.getGroup(customer.id);
            const finalOrder = { ...newOrder, customer: { ...customer, group } };
            set({ order: finalOrder });
            return finalOrder;
        }

        return newOrder;
    },

    loadCustomer: async (id) => {
        const customer = await customersApi.get(id);
        get().selectCustomer(customer);
        return customer;
    },

    pushCoupon: (coupon) => {
        const order = get().order;

        const alreadyAdded = order.coupons.some((_coupon: any) => _coupon.code === coupon.code);
        if (alreadyAdded) {
            const message = 'This coupon is already added to the cart';
            toast.error(message);
            throw new Error(message);
        }

        set((state) => ({
            order: {
                ...state.order,
                coupons: [...state.order.coupons, coupon],
            },
        }));
        get().refreshCart();
    },

    removeCoupon: (coupon) => {
        set((state) => ({
            order: {
                ...state.order,
                coupons: state.order.coupons.filter((c) => c !== coupon),
            },
        }));
    },
});
