/**
 * services/order-submission.ts
 *
 * Order submission pipeline, payload preparation, and validation.
 */

import { Order } from '@/types/models/order';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { ordersApi } from '@/api';
import { toast } from 'sonner';

export interface OrderSubmissionOptions {
    options: Record<string, any>;
    onSuccessReset?: () => void;
}

/**
 * Validates business constraints before submitting an order.
 */
export function validateOrderForSubmission(order: Order, options: Record<string, any>): void {
    if (order.payment_status === 'hold') {
        return; // Hold orders can proceed without payment checks
    }

    if (order.products.length === 0) {
        const msg = 'Cart is empty. Please add at least one product.';
        toast.error(msg);
        throw new Error(msg);
    }

    const isUnpaid = order.payments.length === 0 || order.tendered <= 0;
    const isPartial = order.total > order.tendered && order.tendered > 0;

    if (isUnpaid && options[POS_OPTION_KEYS.allowUnpaid] === 'no') {
        const msg = 'Unpaid orders are not allowed. Please add at least one payment.';
        toast.error(msg);
        throw new Error(msg);
    }

    if (isPartial && options[POS_OPTION_KEYS.allowPartial] === 'no') {
        const msg = 'Partially paid orders are disabled.';
        toast.error(msg);
        throw new Error(msg);
    }
}

/**
 * Normalizes an Order object into the expected API payload structure.
 */
export function prepareOrderPayload(order: Order): any {
    return {
        ...order,
        coupons: order.coupons?.map((c: any) => ({
            ...c,
            coupon_id: c.coupon_id || c.id,
        })),
    };
}

/**
 * Executes order submission via the API layer.
 */
export async function executeOrderSubmission(
    order: Order,
    options: Record<string, any>,
): Promise<any> {
    validateOrderForSubmission(order, options);

    const payload = prepareOrderPayload(order);
    const submittedOrder = await ordersApi.submit(payload);

    // Audio feedback if configured
    const soundUrl = options[POS_OPTION_KEYS.completeSaleAudio];
    if (soundUrl && soundUrl.length > 0) {
        new Audio(soundUrl).play().catch((err: Error) => {
            console.warn('[POS] Sale audio playback blocked:', err.message);
        });
    }

    return submittedOrder;
}
