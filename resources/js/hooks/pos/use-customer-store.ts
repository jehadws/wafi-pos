/**
 * hooks/pos/use-customer-store.ts
 *
 * Zustand slice — customer & coupon state management.
 *
 * Extracted from usePOS.ts:
 *   selectCustomer, loadCustomer, pushCoupon, removeCoupon
 */

import { Customer } from '@/interfaces/customer';
import { customersApi } from '@/api';
import { StateCreator } from 'zustand';
import { toast } from 'sonner';

const __ = (ns: any) => ns;

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

export const createCustomerSlice: StateCreator<any, [], [], CustomerSlice> = (set, get) => ({
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

        order.coupons.forEach((_coupon: any) => {
            if (_coupon.code === coupon.code) {
                const message = __('This coupon is already added to the cart');
                toast.error(message);
                throw message;
            }
        });

        order.coupons.push(coupon);
        set({ order });
        get().refreshCart();
    },

    removeCoupon: (coupon) => {
        const order = get().order;
        const coupons = order.coupons;
        const index = coupons.indexOf(coupon);
        coupons.splice(index, 1);
        order.coupons = coupons;
        set({ order });
    },
});
