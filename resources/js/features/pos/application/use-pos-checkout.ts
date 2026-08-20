import { useEffect, useState } from 'react';
import { Customer } from '@/types/module';
import { Order } from '@/interfaces/order';
import { OrderType } from '@/interfaces/order-type';

export interface UsePosCheckoutOptions {
    order: Order;
    selectCustomer: (customer: Customer) => void;
    setOrderType: (type: OrderType) => void;
    setShipping: (amount: number) => void;
}

export function usePosCheckout({
    order,
    selectCustomer,
    setOrderType,
    setShipping,
}: UsePosCheckoutOptions) {
    const [showSelectCustomerDialog, setShowSelectCustomerDialog] = useState(false);
    const [showSelectedCustomerDetailsDialog, setShowSelectedCustomerDetailsDialog] = useState(false);
    const [showOrderTypeDialog, setShowOrderTypeDialog] = useState(false);
    const [showShippingDialog, setShowShippingDialog] = useState(false);
    const [showPaymentGatewayDialog, setShowPaymentGatewayDialog] = useState(false);
    const [useBillingAddress, setUseBillingAddress] = useState(false);
    const [useShippingAddress, setUseShippingAddress] = useState(false);
    const [shouldValidate, setShouldValidate] = useState(false);

    // Validation sequence when payment is triggered
    useEffect(() => {
        if (shouldValidate) {
            if (!order.customer || !order.customer_id) {
                setShowSelectCustomerDialog(true);
            } else if (!order.type) {
                setShowOrderTypeDialog(true);
                setShouldValidate(false);
            }
        }
    }, [shouldValidate, order.customer, order.customer_id, order.type]);

    const handleSelectCustomer = (customer: Customer) => {
        selectCustomer(customer);
        setShowSelectCustomerDialog(false);
    };

    const handleSelectOrderType = (orderType: OrderType | null) => {
        if (orderType?.identifier === 'delivery') {
            setShowShippingDialog(true);
        }
        if (orderType?.identifier === 'takeaway') {
            setShipping(0);
        }
        if (orderType) {
            setOrderType(orderType);
        }
    };

    const openCustomerDetails = () => {
        setShowSelectCustomerDialog(false);
        setShowSelectedCustomerDetailsDialog(true);
    };

    return {
        showSelectCustomerDialog,
        setShowSelectCustomerDialog,
        showSelectedCustomerDetailsDialog,
        setShowSelectedCustomerDetailsDialog,
        showOrderTypeDialog,
        setShowOrderTypeDialog,
        showShippingDialog,
        setShowShippingDialog,
        showPaymentGatewayDialog,
        setShowPaymentGatewayDialog,
        useBillingAddress,
        setUseBillingAddress,
        useShippingAddress,
        setUseShippingAddress,
        shouldValidate,
        setShouldValidate,
        handleSelectCustomer,
        handleSelectOrderType,
        openCustomerDetails,
    };
}
