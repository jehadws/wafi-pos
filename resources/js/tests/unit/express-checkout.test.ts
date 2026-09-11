import { buildExactCashPayment, canSubmitExactCash } from '@/services/express-checkout';
import { Order } from '@/types/models/order';
import { describe, expect, it } from 'vitest';

const makeOrder = (overrides: Partial<Order> = {}): Order =>
  ({
    total: 50,
    tendered: 0,
    payments: [],
    ...overrides,
  }) as unknown as Order;

describe('services/express-checkout.ts', () => {
  describe('canSubmitExactCash', () => {
    it('is eligible for a normal cash-ready cart', () => {
      expect(canSubmitExactCash(makeOrder(), 3)).toBe(true);
    });

    it('rejects an empty cart', () => {
      expect(canSubmitExactCash(makeOrder(), 0)).toBe(false);
    });

    it('rejects zero and negative totals (fully discounted carts)', () => {
      expect(canSubmitExactCash(makeOrder({ total: 0 }), 1)).toBe(false);
      expect(canSubmitExactCash(makeOrder({ total: -5 }), 1)).toBe(false);
    });

    it('rejects when a split tender has already started', () => {
      expect(canSubmitExactCash(makeOrder({ payments: [{ identifier: 'cash-payment', value: 10 }] as any }), 1)).toBe(false);
    });

    it('rejects when a tender amount has been entered', () => {
      expect(canSubmitExactCash(makeOrder({ tendered: 20 }), 1)).toBe(false);
    });
  });

  describe('buildExactCashPayment', () => {
    it('builds a single full-value cash payment', () => {
      expect(buildExactCashPayment(49.99, 'Cash Payment')).toEqual({
        identifier: 'cash-payment',
        value: 49.99,
        label: 'Cash Payment',
        selected: false,
        readonly: false,
      });
    });
  });
});
