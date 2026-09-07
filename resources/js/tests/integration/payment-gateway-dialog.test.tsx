/**
 * tests/integration/payment-gateway-dialog.test.tsx
 *
 * Regression coverage for the redesigned payment sheet: single-column layout
 * with an always-visible payments list, quick-amount shortcuts derived from
 * the due balance, "Add" as the single record action (no Full Payment
 * button), explicit confirmations for partial records and partial
 * finalization, and a footer that always shows the primary action.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PaymentGatewayDialog } from '@/components/pos/payment-gateway-dialog';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { submitAndFinalizeOrder } from '@/services/order-finalize';
import { usePOS } from '@/hooks/usePOS';

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({ t: (s: string) => s }),
}));

vi.mock('sonner', () => ({
    toast: { error: vi.fn(), warning: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

vi.mock('@/utils/sound', () => ({ playSound: vi.fn() }));

vi.mock('@/services/order-finalize', () => ({
    submitAndFinalizeOrder: vi.fn().mockResolvedValue({}),
}));

const cash = { identifier: 'cash', label: 'Cash', selected: true, priority: 1 };
const card = { identifier: 'card', label: 'Card', selected: false, priority: 2 };

const setupStore = ({
    total = 100,
    payments = [],
    options = {},
}: { total?: number; payments?: any[]; options?: Record<string, any> } = {}) => {
    usePOS.getState().reset();
    usePOS.setState({
        options: {
            [POS_OPTION_KEYS.allowUnpaid]: 'yes',
            [POS_OPTION_KEYS.allowPartial]: 'yes',
            ...options,
        },
        paymentsType: [cash, card],
        selectedPaymentType: cash,
        order: {
            ...usePOS.getState().order,
            total,
            payments,
            tendered: payments.reduce((sum: number, p: any) => sum + p.value, 0),
            change: 0,
            payment_status: 'unpaid',
        },
    } as any);
};

const renderDialog = () =>
    render(
        <PaymentGatewayDialog
            open={true}
            onOpenChange={vi.fn()}
            useBillingAddress={false}
            useShippingAddress={false}
            resetCart={vi.fn()}
        />,
    );

const typeAmount = (digits: string) => {
    for (const digit of digits) {
        fireEvent.click(screen.getByRole('button', { name: digit }));
    }
};


describe('components/pos/payment-gateway-dialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupStore();
    });

    it('shows the payment state and an always-visible (empty) payments list', () => {
        renderDialog();

        expect(screen.getByText('Total')).toBeTruthy();
        expect(screen.getByText('Due')).toBeTruthy();
        expect(screen.getByText('Change')).toBeTruthy();
        // Total, Due and the exact-amount quick chip all read $100.00
        expect(screen.getAllByText('$100.00').length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('Payments')).toBeTruthy();
        expect(screen.getByText('Nothing to display...')).toBeTruthy();
    });

    it('uses Add as the single record action and drops Full Payment', () => {
        renderDialog();

        expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Full Payment' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Enter' })).toBeNull();
    });

    it('adds a typed partial amount after explicit confirmation', () => {
        renderDialog();

        typeAmount('3000'); // $30.00 of a $100.00 due
        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        // The ambiguous case: confirm before recording
        expect(usePOS.getState().order.payments).toHaveLength(0);
        expect(screen.getByRole('button', { name: 'Confirm' })).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

        expect(usePOS.getState().order.payments).toHaveLength(1);
        expect(usePOS.getState().order.payments[0]).toMatchObject({
            identifier: 'cash',
            value: 30,
            label: 'Cash',
        });
        // Paid card and payment row both read $30.00
        expect(screen.getAllByText('$30.00').length).toBeGreaterThanOrEqual(2);
    });

    it('populates amount using the Exact quick-amount shortcut and records without partial confirmation', () => {
        renderDialog();

        // Exact quick chip should exist with $100.00
        const exactChip = screen.getByRole('button', { name: /Exact.*\$100\.00/i });
        expect(exactChip).toBeTruthy();

        fireEvent.click(exactChip);
        // Clicking Add on exact/full due should NOT show partial confirmation
        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
        expect(usePOS.getState().order.payments).toHaveLength(1);
        expect(usePOS.getState().order.payments[0]).toMatchObject({
            identifier: 'cash',
            value: 100,
        });
    });

    it('prompts confirmation when submitting an order with an unpaid remaining balance', async () => {
        // Setup order with $30 paid out of $100
        setupStore({
            total: 100,
            payments: [{ identifier: 'cash', label: 'Cash', value: 30 }],
        });
        renderDialog();

        const submitBtn = screen.getByRole('button', { name: 'Submit Payment' });
        fireEvent.click(submitBtn);

        // Submit Partial Payment confirmation dialog should appear with Continue button
        expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
        expect(submitAndFinalizeOrder).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

        await waitFor(() => {
            expect(submitAndFinalizeOrder).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderData: expect.objectContaining({
                        payment_status: 'partially_paid',
                    }),
                }),
            );
        });
    });

    it('removes a payment from the payments list', () => {
        setupStore({
            total: 100,
            payments: [{ identifier: 'cash', label: 'Cash', value: 50 }],
        });
        renderDialog();

        expect(screen.getAllByText('Cash').length).toBeGreaterThanOrEqual(2);
        fireEvent.click(screen.getByRole('button', { name: 'Remove Cash' }));

        expect(usePOS.getState().order.payments).toHaveLength(0);
        expect(screen.getByText('Nothing to display...')).toBeTruthy();
    });

    it('renders payment method options with >= 48px touch target height', () => {
        renderDialog();

        const cashBtn = screen.getByRole('button', { name: 'Cash' });
        expect(cashBtn.className).toContain('min-h-[48px]');
    });
});
