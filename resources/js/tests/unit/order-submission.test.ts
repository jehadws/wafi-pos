import { describe, expect, it, vi } from 'vitest';
import {
    prepareOrderPayload,
    validateOrderForSubmission,
} from '@/services/order-submission';
import { Order } from '@/types/models/order';
import { POS_OPTION_KEYS } from '@/constants/pos-options';

describe('services/order-submission.ts', () => {
    describe('validateOrderForSubmission', () => {
        it('throws error when cart is empty', () => {
            const emptyOrder: Order = {
                payment_status: 'paid',
                products: [],
                payments: [],
                total: 100,
                tendered: 100,
            } as any;

            expect(() => validateOrderForSubmission(emptyOrder, {})).toThrow(
                'Cart is empty',
            );
        });

        it('allows hold orders even if unpaid or empty payments', () => {
            const holdOrder: Order = {
                payment_status: 'hold',
                products: [{ id: 1 }] as any,
                payments: [],
                total: 100,
                tendered: 0,
            } as any;

            expect(() =>
                validateOrderForSubmission(holdOrder, { [POS_OPTION_KEYS.allowUnpaid]: 'no' }),
            ).not.toThrow();
        });

        it('blocks unpaid orders when allowUnpaid is no', () => {
            const unpaidOrder: Order = {
                payment_status: 'unpaid',
                products: [{ id: 1 }] as any,
                payments: [],
                total: 100,
                tendered: 0,
            } as any;

            expect(() =>
                validateOrderForSubmission(unpaidOrder, { [POS_OPTION_KEYS.allowUnpaid]: 'no' }),
            ).toThrow('Unpaid orders are not allowed');
        });

        it('allows zero-total orders (fully discounted) even when allowUnpaid is no', () => {
            const fullyDiscountedOrder: Order = {
                payment_status: 'unpaid',
                products: [{ id: 1 }] as any,
                payments: [],
                total: 0,      // $5 product - $5 discount = $0
                tendered: 0,
            } as any;

            expect(() =>
                validateOrderForSubmission(fullyDiscountedOrder, { [POS_OPTION_KEYS.allowUnpaid]: 'no' }),
            ).not.toThrow();
        });

        it('blocks partially paid orders when allowPartial is no', () => {
            const partialOrder: Order = {
                payment_status: 'partially_paid',
                products: [{ id: 1 }] as any,
                payments: [{ value: 50 }] as any,
                total: 100,
                tendered: 50,
            } as any;

            expect(() =>
                validateOrderForSubmission(partialOrder, { [POS_OPTION_KEYS.allowPartial]: 'no' }),
            ).toThrow('Partially paid orders are disabled');
        });
    });

    describe('prepareOrderPayload', () => {
        it('maps coupons with coupon_id correctly', () => {
            const order: Order = {
                coupons: [
                    { id: 10, name: 'Summer 10%' },
                    { coupon_id: 20, name: 'VIP 20%' },
                ],
            } as any;

            const payload = prepareOrderPayload(order);
            expect(payload.coupons[0].coupon_id).toBe(10);
            expect(payload.coupons[1].coupon_id).toBe(20);
        });
    });
});
