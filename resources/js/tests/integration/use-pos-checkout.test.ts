import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePosCheckout } from '@/features/pos/application/use-pos-checkout';
import { Order } from '@/interfaces/order';
import { Customer } from '@/types/module';
import { OrderType } from '@/interfaces/order-type';

describe('features/pos/application/use-pos-checkout', () => {
    const mockOrder: Order = {
        id: 1,
        total: 100,
        customer_id: 10,
        customer: { id: 10, first_name: 'John', last_name: 'Doe' } as any,
        type: { identifier: 'takeaway', label: 'Take Away' } as any,
    } as any;

    it('manages customer selection and dialog state', () => {
        const selectCustomer = vi.fn();
        const setOrderType = vi.fn();
        const setShipping = vi.fn();

        const { result } = renderHook(() =>
            usePosCheckout({
                order: mockOrder,
                selectCustomer,
                setOrderType,
                setShipping,
            }),
        );

        const newCustomer: Customer = { id: 20, first_name: 'Jane', last_name: 'Smith' } as any;

        act(() => {
            result.current.handleSelectCustomer(newCustomer);
        });

        expect(selectCustomer).toHaveBeenCalledWith(newCustomer);
        expect(result.current.showSelectCustomerDialog).toBe(false);
    });

    it('handles delivery order type and triggers shipping dialog', () => {
        const selectCustomer = vi.fn();
        const setOrderType = vi.fn();
        const setShipping = vi.fn();

        const { result } = renderHook(() =>
            usePosCheckout({
                order: mockOrder,
                selectCustomer,
                setOrderType,
                setShipping,
            }),
        );

        const deliveryType: OrderType = {
            identifier: 'delivery',
            label: 'Home Delivery',
        } as any;

        act(() => {
            result.current.handleSelectOrderType(deliveryType);
        });

        expect(setOrderType).toHaveBeenCalledWith(deliveryType);
        expect(result.current.showShippingDialog).toBe(true);
    });

    it('resets shipping for takeaway orders', () => {
        const selectCustomer = vi.fn();
        const setOrderType = vi.fn();
        const setShipping = vi.fn();

        const { result } = renderHook(() =>
            usePosCheckout({
                order: mockOrder,
                selectCustomer,
                setOrderType,
                setShipping,
            }),
        );

        const takeawayType: OrderType = {
            identifier: 'takeaway',
            label: 'Take Away',
        } as any;

        act(() => {
            result.current.handleSelectOrderType(takeawayType);
        });

        expect(setShipping).toHaveBeenCalledWith(0);
        expect(setOrderType).toHaveBeenCalledWith(takeawayType);
    });
});
