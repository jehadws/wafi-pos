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

import { Payment } from '@/types/models/payment';
import { PaymentType } from '@/types/models/payment-type';
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
    // Initial state — empty until backend provides payment types
    paymentsType: [],
    selectedPaymentType: null,

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
        void payment;
        // Account payment handling is managed by the backend
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
        const sorted = [...payments].sort((a, b) => a.priority - b.priority);
        const withSelection = sorted.map((p, i) => ({ ...p, selected: i === 0 }));
        set({ paymentsType: withSelection, selectedPaymentType: withSelection[0] ?? null });
    },

    runPaymentQueue: async () => {
        // Future: run payment queue plugins here
    },
});
