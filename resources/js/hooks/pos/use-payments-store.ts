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
import { StateCreator } from 'zustand';
import { toast } from 'sonner';

const __ = (ns: any) => ns;

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

export const createPaymentsSlice: StateCreator<any, [], [], PaymentsSlice> = (set, get) => ({
    // Initial state
    paymentsType: [],
    selectedPaymentType: null,

    addPayment: (payment) => {
        if (payment.value > 0) {
            const order = get().order;
            order.payments.push(payment);
            set({ order });
            get().computePaid();
        } else {
            toast.error('Invalid amount.');
        }
    },

    removePayment: (payment) => {
        if (payment.id !== undefined) {
            toast.error(__('Unable to delete a payment attached to the order.'));
            return;
        }

        const order = get().order;
        const index = order.payments.indexOf(payment);
        order.payments.splice(index, 1);
        set({ order });

        get().updateCustomerAccount(payment);
        get().computePaid();
    },

    updateCustomerAccount: (payment) => {
        if (payment.identifier === 'account-payment') {
            const customer = get().order.customer;
            customer.account_amount += payment.value;
            get().selectCustomer(customer);
        }
    },

    computePaid: () => {
        const order = get().order;
        order.tendered = 0;

        if (order.payments.length > 0) {
            order.tendered = order.payments
                .map((p: any) => p.value)
                .reduce((b: number, a: number) => a + b);
        }

        if (order.tendered >= order.total) {
            order.payment_status = 'paid';
        } else if (order.tendered > 0 && order.tendered < order.total) {
            order.payment_status = 'partially_paid';
        }

        order.change = order.tendered - order.total;
        set({ order });
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
