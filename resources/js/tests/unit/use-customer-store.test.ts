import { usePOS } from '@/hooks/usePOS';
import { Customer } from '@/types/models/customer';
import { beforeEach, describe, expect, it } from 'vitest';

describe('use-customer-store (Zustand Customer & Coupon Slice)', () => {
  beforeEach(() => {
    usePOS.getState().reset();
  });

  it('selects a customer and populates customer_id and billing address', async () => {
    const mockCustomer: Customer = {
      id: 42,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      group: { id: 1, name: 'VIP', minimal_credit_payment: 0 } as any,
      billing: {
        id: 99,
        first_name: 'John',
        last_name: 'Doe',
        address_1: '123 Main St',
        city: 'Riyadh',
        country: 'Saudi Arabia',
      },
    };

    await usePOS.getState().selectCustomer(mockCustomer);

    const order = usePOS.getState().order;
    expect(order.customer_id).toBe(42);
    expect(order.customer?.first_name).toBe('John');
    expect(order.addresses.billing?.address_1).toBe('123 Main St');
  });

  it('pushes and removes coupons immutably', () => {
    const coupon = {
      code: 'SAVE10',
      name: '10% Discount',
      type: 'percentage_discount',
      discount_value: 10,
      products: [],
      categories: [],
    };

    usePOS.getState().pushCoupon(coupon);
    expect(usePOS.getState().order.coupons).toHaveLength(1);
    expect(usePOS.getState().order.coupons[0].code).toBe('SAVE10');

    // Cannot add duplicate coupon
    expect(() => usePOS.getState().pushCoupon(coupon)).toThrow('already added');

    // Remove coupon
    usePOS.getState().removeCoupon(usePOS.getState().order.coupons[0]);
    expect(usePOS.getState().order.coupons).toHaveLength(0);
  });
});
