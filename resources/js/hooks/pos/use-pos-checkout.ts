import { Customer } from '@/types/models/customer';
import { Order } from '@/types/models/order';
import { OrderType } from '@/types/models/order-type';
import { useState } from 'react';

/**
 * Owns the visibility of the checkout dialogs (customer select, order type,
 * shipping, payment gateway). Dialogs are opened explicitly by the UI.
 *
 * Defaults for customer / order type are assigned when the POS boots
 * (pages/dashboard/pos.tsx), so the Pay-time customer/type checks in
 * payment-actions.tsx act as fallbacks only — not as a forced flow.
 */
export interface UsePosCheckoutOptions {
  order: Order;
  selectCustomer: (customer: Customer) => void;
  setOrderType: (type: OrderType) => void;
  setShipping: (amount: number) => void;
}

export function usePosCheckout({ selectCustomer, setOrderType }: UsePosCheckoutOptions) {
  const [showSelectCustomerDialog, setShowSelectCustomerDialog] = useState(false);
  const [showSelectedCustomerDetailsDialog, setShowSelectedCustomerDetailsDialog] = useState(false);
  const [showOrderTypeDialog, setShowOrderTypeDialog] = useState(false);
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [showPaymentGatewayDialog, setShowPaymentGatewayDialog] = useState(false);
  const [useBillingAddress, setUseBillingAddress] = useState(false);
  const [useShippingAddress, setUseShippingAddress] = useState(false);

  const handleSelectCustomer = (customer: Customer) => {
    selectCustomer(customer);
    setShowSelectCustomerDialog(false);
  };

  const handleSelectOrderType = (orderType: OrderType | null) => {
    if (orderType?.identifier === 'delivery') {
      setShowShippingDialog(true);
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
    handleSelectCustomer,
    handleSelectOrderType,
    openCustomerDetails,
  };
}
