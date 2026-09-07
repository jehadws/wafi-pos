/**
 * tests/unit/use-pos-submit-order.test.ts
 *
 * Regression coverage for the unpaid/partial policy guards in
 * usePOS.submitOrder — the path the payment gateway dialog's "Unpaid"
 * button takes (handleSaveAsUnpaid → handleSubmitOrder('unpaid') → submitOrder).
 *
 * Historical bug: a zero-payment submission was gated on the *partial* policy
 * first, so saving an order as Unpaid produced the misleading
 * "Partially paid orders are disabled." toast even when partial payments were
 * enabled. Zero recorded payments is an UNPAID submission and must be gated on
 * the unpaid policy — mirroring the backend guard (OrdersService:
 * $totalPayments === 0 → allow_unpaid) and validateOrderForSubmission.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { usePOS } from '@/hooks/usePOS';
import { ordersApi } from '@/api';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
    toast: { error: vi.fn(), warning: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

vi.mock('@/api', async (importOriginal) => {
    const actual = await importOriginal<Record<string, any>>();
    return {
        ...actual,
        ordersApi: {
            ...actual.ordersApi,
            submit: vi.fn().mockResolvedValue({ data: { order: { id: 1, code: 'LOCAL-1' } } }),
        },
    };
});

const makeOrder = (overrides: Record<string, any> = {}): any => ({
    ...usePOS.getState().order,
    total: 100,
    payments: [],
    tendered: 0,
    payment_status: 'unpaid',
    products: [{ id: 1, quantity: 1, unit_price: 100, total_price: 100 }],
    instalments: [],
    customer: undefined,
    ...overrides,
});

const setScenario = (options: Record<string, any>, orderOverrides: Record<string, any> = {}) => {
    usePOS.setState({
        options,
        isSubmitting: false,
        order: makeOrder(orderOverrides),
    } as any);
};

describe('usePOS.submitOrder — unpaid/partial policy guards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('blocks an unpaid submission with the UNPAID message when both policies are disabled', async () => {
        // Regression: the old guard checked allowPartial first, so this exact
        // scenario answered with "Partially paid orders are disabled."
        setScenario({
            [POS_OPTION_KEYS.allowUnpaid]: 'no',
            [POS_OPTION_KEYS.allowPartial]: 'no',
        });

        await expect(
            usePOS.getState().submitOrder({ payment_status: 'unpaid' }),
        ).rejects.toThrow('Unpaid orders are not allowed. Please add at least one payment.');

        expect(toast.error).toHaveBeenCalledWith(
            'Unpaid orders are not allowed. Please add at least one payment.',
        );
        expect(vi.mocked(ordersApi.submit)).not.toHaveBeenCalled();
    });

    it('blocks an unpaid submission when only allowUnpaid is disabled', async () => {
        setScenario({
            [POS_OPTION_KEYS.allowUnpaid]: 'no',
            [POS_OPTION_KEYS.allowPartial]: 'yes',
        });

        await expect(
            usePOS.getState().submitOrder({ payment_status: 'unpaid' }),
        ).rejects.toThrow('Unpaid orders are not allowed. Please add at least one payment.');
        expect(vi.mocked(ordersApi.submit)).not.toHaveBeenCalled();
    });

    it('proceeds with an unpaid submission when allowPartial is disabled but allowUnpaid is enabled', async () => {
        // The reported symptom: saving as Unpaid must not be blocked by the
        // partial-payment policy — zero payments is not a partial payment.
        setScenario({
            [POS_OPTION_KEYS.allowUnpaid]: 'yes',
            [POS_OPTION_KEYS.allowPartial]: 'no',
        });

        await expect(
            usePOS.getState().submitOrder({ payment_status: 'unpaid' }),
        ).resolves.toBeTruthy();

        expect(toast.error).not.toHaveBeenCalled();
        expect(vi.mocked(ordersApi.submit)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(ordersApi.submit).mock.calls[0][0]).toMatchObject({
            payment_status: 'unpaid',
            total: 100,
        });
    });

    it('still blocks a genuine partial submission when allowPartial is disabled', async () => {
        // Partial enforcement for tendered > 0 lives in
        // validateOrderForSubmission (order-submission.ts), reached later in
        // the same pipeline — it must keep rejecting partial submissions.
        setScenario(
            {
                [POS_OPTION_KEYS.allowUnpaid]: 'yes',
                [POS_OPTION_KEYS.allowPartial]: 'no',
            },
            {
                payments: [{ identifier: 'cash-payment', label: 'Cash', value: 30 }],
                tendered: 30,
                payment_status: 'partially_paid',
            },
        );

        await expect(usePOS.getState().submitOrder({})).rejects.toThrow(
            'Partially paid orders are disabled.',
        );
        expect(vi.mocked(ordersApi.submit)).not.toHaveBeenCalled();
    });

    it('proceeds with an unpaid submission when both policies are enabled', async () => {
        setScenario({
            [POS_OPTION_KEYS.allowUnpaid]: 'yes',
            [POS_OPTION_KEYS.allowPartial]: 'yes',
        });

        await expect(
            usePOS.getState().submitOrder({ payment_status: 'unpaid' }),
        ).resolves.toBeTruthy();
        expect(vi.mocked(ordersApi.submit)).toHaveBeenCalledTimes(1);
    });

    it('does not run the layaway minimum-payment guard when saving as Unpaid', async () => {
        // Regression: submitOrder always called canProceedAsLaidAway for
        // zero-payment non-hold orders, even when the cashier explicitly chose
        // "Unpaid". If the customer's group had a minimal_credit_payment > 0,
        // the guard threw "Before saving this order, a minimum payment of X is
        // required" — completely wrong for the Unpaid intent.
        setScenario(
            {
                [POS_OPTION_KEYS.allowUnpaid]: 'yes',
                [POS_OPTION_KEYS.allowPartial]: 'yes',
            },
            {
                payment_status: 'unpaid',
                // Simulate a customer whose group demands a 20% minimum payment
                customer: {
                    group: { minimal_credit_payment: 20 },
                },
            },
        );

        // Must resolve without throwing "minimum payment required"
        await expect(
            usePOS.getState().submitOrder({ payment_status: 'unpaid' }),
        ).resolves.toBeTruthy();

        expect(toast.error).not.toHaveBeenCalled();
        expect(vi.mocked(ordersApi.submit)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(ordersApi.submit).mock.calls[0][0]).toMatchObject({
            payment_status: 'unpaid',
        });
    });
});
