import { beforeEach, describe, expect, it } from 'vitest';
import { usePOS } from '@/hooks/usePOS';

describe('use-payments-store (Zustand Payments Slice)', () => {
    beforeEach(() => {
        usePOS.getState().reset();
    });

    it('adds a valid payment and recomputes tendered and change amounts', () => {
        // Set order total to 100
        usePOS.setState((state) => ({
            order: { ...state.order, total: 100, tendered: 0, change: 0, payment_status: 'unpaid' },
        }));

        usePOS.getState().addPayment({
            identifier: 'cash-payment',
            label: 'Cash',
            value: 60,
            readonly: false,
            selected: true,
        });

        const order = usePOS.getState().order;
        expect(order.payments).toHaveLength(1);
        expect(order.tendered).toBe(60);
        expect(order.payment_status).toBe('partially_paid');
    });

    it('marks order as paid when tendered equals or exceeds total', () => {
        usePOS.setState((state) => ({
            order: { ...state.order, total: 100, tendered: 0, change: 0, payment_status: 'unpaid' },
        }));

        usePOS.getState().addPayment({
            identifier: 'cash-payment',
            label: 'Cash',
            value: 120,
            readonly: false,
            selected: true,
        });

        const order = usePOS.getState().order;
        expect(order.tendered).toBe(120);
        expect(order.change).toBe(20);
        expect(order.payment_status).toBe('paid');
    });

    it('removes payment and recalculates balance', () => {
        usePOS.setState((state) => ({
            order: { ...state.order, total: 100, tendered: 0, change: 0 },
        }));

        const payment = {
            identifier: 'card-payment',
            label: 'Credit Card',
            value: 50,
            readonly: false,
            selected: true,
        };

        usePOS.getState().addPayment(payment);
        expect(usePOS.getState().order.payments).toHaveLength(1);

        usePOS.getState().removePayment(usePOS.getState().order.payments[0]);
        expect(usePOS.getState().order.payments).toHaveLength(0);
        expect(usePOS.getState().order.tendered).toBe(0);
        expect(usePOS.getState().order.payment_status).toBe('unpaid');
    });

    it('resets payment_status to unpaid (not partially_paid) when the only payment is removed', () => {
        // Regression: computePaid used to fall back to `order.payment_status`
        // (the pre-removal value) when tendered dropped to 0, leaving the order
        // in a `partially_paid` state even though payments === [].
        usePOS.setState((state) => ({
            order: { ...state.order, total: 100, tendered: 0, change: 0, payment_status: 'unpaid' },
        }));

        const payment = {
            identifier: 'cash-payment',
            label: 'Cash',
            value: 40,
            readonly: false,
            selected: true,
        };

        usePOS.getState().addPayment(payment);
        expect(usePOS.getState().order.payment_status).toBe('partially_paid');

        // Remove the only payment — status must reset to 'unpaid', not stay 'partially_paid'
        usePOS.getState().removePayment(usePOS.getState().order.payments[0]);
        expect(usePOS.getState().order.payments).toHaveLength(0);
        expect(usePOS.getState().order.tendered).toBe(0);
        expect(usePOS.getState().order.payment_status).toBe('unpaid');
    });

    it('toggles active payment type', () => {
        const defaultType = usePOS.getState().paymentsType[0];
        if (defaultType) {
            usePOS.getState().setPaymentActive(defaultType);
            const active = usePOS.getState().paymentsType.find((p) => p.identifier === defaultType.identifier);
            expect(active?.selected).toBe(true);
        }
    });
});
