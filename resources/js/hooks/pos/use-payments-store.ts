/**
 * hooks/pos/use-payments-store.ts
 *
 * Zustand slice — payment state management.
 *
 * Extracted from usePOS.ts:
 *   paymentsType, selectedPaymentType,
 *   addPayment, removePayment, updateCustomerAccount,
 *   computePaid, setPaymentActive, definedPaymentsType, runPaymentQueue
 */

import { Payment } from '@/interfaces/payment';
import { PaymentType } from '@/interfaces/payment-type';
import { buildDefaultPaymentTypes } from '@/constants/payment-methods';
import type { POSStore } from './pos-store-types';
import { StateCreator } from 'zustand';
import { toast } from 'sonner';



// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentsSliceState {
    paymentsType: PaymentType[];
    selectedPaymentType: PaymentType | null;
}

export interface PaymentsSliceActions {
    addPayment: (payment: Payment) => void;
    removePayment: (payment: Payment) => void;
    updateCustomerAccount: (payment: Payment) => void;
    computePaid: () => void;
    setPaymentActive: (payment: PaymentType) => void;
    definedPaymentsType: (payments: PaymentType[]) => void;
    runPaymentQueue: () => Promise<any>;
}

export type PaymentsSlice = PaymentsSliceState & PaymentsSliceActions;

// ---------------------------------------------------------------------------
// Slice factory
// ---------------------------------------------------------------------------

export const createPaymentsSlice: StateCreator<POSStore, [], [], PaymentsSlice> = (set, get) => ({
    // Initial state
    paymentsType: buildDefaultPaymentTypes(),
    selectedPaymentType: buildDefaultPaymentTypes()[0] ?? null,

    addPayment: (payment) => {
        if (payment.value > 0) {
            // ✅ immutable — creates a new payments array so Zustand detects the change
            set((state) => ({
                order: {
                    ...state.order,
                    payments: [...state.order.payments, payment],
                },
            }));
            get().computePaid();
        } else {
            toast.error('Invalid amount.');
        }
    },

    removePayment: (payment) => {
        if (payment.id !== undefined) {
            toast.error('Unable to delete a payment attached to the order.');
            return;
        }

        // ✅ immutable — filter creates a new array
        set((state) => ({
            order: {
                ...state.order,
                payments: state.order.payments.filter((p) => p !== payment),
            },
        }));

        get().updateCustomerAccount(payment);
        get().computePaid();
    },

    updateCustomerAccount: (payment) => {
        if (payment.identifier === 'account-payment') {
            // ✅ Spread customer before mutating so Zustand sees a new reference
            const customer = { ...get().order.customer, account_amount: (get().order.customer?.account_amount ?? 0) + payment.value };
            get().selectCustomer(customer);
        }
    },

    computePaid: () => {
        const order = get().order;

        const tendered =
            order.payments.length > 0
                ? order.payments
                      .map((p: Payment) => p.value)
                      .reduce((b: number, a: number) => a + b, 0)
                : 0;

        const payment_status: typeof order.payment_status =
            tendered >= order.total
                ? 'paid'
                : tendered > 0
                  ? 'partially_paid'
                  : order.payment_status;

        const change = tendered - order.total;

        // ✅ immutable — spread creates a new order object
        set({
            order: { ...order, tendered, payment_status, change },
        });
    },

    setPaymentActive: (payment) => {
        const payments = get().paymentsType.map((p: PaymentType) => ({
            ...p,
            selected: p.identifier === payment.identifier,
        }));
        set({ paymentsType: payments });
    },

    definedPaymentsType: (payments) => {
        set({ paymentsType: payments });
    },

    runPaymentQueue: async () => {
        // Future: run payment queue plugins here
    },
});
