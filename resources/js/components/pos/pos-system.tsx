import CartTable from '@/components/pos/cart-table';
import PaymentActions from '@/components/pos/payment-actions';
import TotalsSummary from '@/components/pos/totals-summary';
import PrimaryNavigation from '@/components/primary-navigation';
import SecondaryNavigation from '@/components/secondary-navigation';
import { useDebouncedEffect } from '@/hooks/use-debounced-effect';
import { useNumericKeypad } from '@/hooks/use-numeric-keypad';
import { useRTL } from '@/hooks/use-rtl';
import { usePOS } from '@/hooks/usePOS';
import { OrderProduct } from '@/interfaces/order-product';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { Barcode, Search, Shrink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import ConfirmationDialog from '../confirmation-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { NumericKeypadDialog } from '../ui/numeric-keypad-dialog';
import { CustomerDetailsDialog } from './customer-details-dialog';
import { SelectCustomerDialog } from './customer-select-dialog';
import { OrderTypeDialog } from './order-type-dialog';
import { OrdersDialog } from './orders-dialog';
import { PaymentGatewayDialog } from './payment-gateway-dialog';
import ProductsCategoriesPanel from './products-categories-panel';
import { SearchProductsDialog } from './search-products-dialog';
import { ShippingDialog } from './shipping-dialog';

function calculateNewTaxValue(oldPriceWithoutTax: number, oldTaxValue: number, newPriceWithoutTax: number) {
  const taxRate = oldTaxValue / oldPriceWithoutTax;
  const newTaxValue = newPriceWithoutTax * taxRate;

  return {
    taxRate: +(taxRate * 100).toFixed(2), // percent
    newTaxValue: +newTaxValue.toFixed(2), // rounded tax value
  };
}

export default function PosSystem() {
  const { products, options, removeProduct, updateProduct, addToCart, order, setDiscount, selectCustomer, setOrderType, autoMerge, setAutoMerge } =
    usePOS();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [isAutoFocusOpen, setIsAutoFocusOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showSelectCustomerDialog, setShowSelectCustomerDialog] = useState(false);
  const [showSelectedCustomerDetailsDialog, setShowSelectedCustomerDetailsDialog] = useState(false);
  const [showOrderTypeDialog, setShowOrderTypeDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchProductsDialog, setShowSearchProductsDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [showPaymentGatewayDialog, setShowPaymentGatewayDialog] = useState(false);
  const [isResetCartOpen, setIsResetCartOpen] = useState(false);

  const [useBillingAddress, setUseBillingAddress] = useState(false);
  const [useShippingAddress, setUseShippingAddress] = useState(false);
  const [shouldValidate, setShouldValidate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchBarcode>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [discountValue, setDiscountValue] = useState('');

  useEffect(() => {
    if (isAutoFocusOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAutoFocusOpen]);

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const matchesShortcut = (e: KeyboardEvent, shortcut: string[] | string | null | undefined): boolean => {
      if (!shortcut || (Array.isArray(shortcut) && shortcut.length === 0)) return false;
      const keys = Array.isArray(shortcut) ? shortcut : [shortcut];
      return keys.some((combo) => {
        const parts = combo.toLowerCase().split('+').map((p) => p.trim());
        const requireCtrl = parts.includes('ctrl');
        const requireAlt = parts.includes('alt');
        const requireShift = parts.includes('shift');
        const mainKey = parts.find((p) => !['ctrl', 'alt', 'shift'].includes(p)) ?? '';
        return (
          e.ctrlKey === requireCtrl &&
          e.altKey === requireAlt &&
          e.shiftKey === requireShift &&
          e.key.toLowerCase() === mainKey
        );
      });
    };

    const handleKeydown = (e: KeyboardEvent) => {
      const o = options;
      if (matchesShortcut(e, o.ns_jgrem_keyboard_payment)) {
        e.preventDefault();
        setShowPaymentGatewayDialog(true);
      } else if (matchesShortcut(e, o.ns_jgrem_keyboard_cancel_order)) {
        e.preventDefault();
        setIsResetCartOpen(true);
      } else if (matchesShortcut(e, o.ns_jgrem_keyboard_shipping)) {
        e.preventDefault();
        setShowShippingDialog(true);
      } else if (matchesShortcut(e, o.ns_jgrem_keyboard_order_type)) {
        e.preventDefault();
        setShowOrderTypeDialog(true);
      } else if (matchesShortcut(e, o.ns_jgrem_keyboard_quick_search)) {
        e.preventDefault();
        setShowSearchProductsDialog(true);
      } else if (matchesShortcut(e, o.ns_jgrem_keyboard_toggle_merge)) {
        e.preventDefault();
        setAutoMerge(!autoMerge);
      } else if (matchesShortcut(e, o.ns_jgrem_keyboard_fullscreen)) {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [options, autoMerge]);
  // ─────────────────────────────────────────────────────────────────────

  const updateDiscount = (discount: string) => {
    setDiscountValue('');
    const finalDiscount = +discount > order.subtotal ? order.subtotal : +discount;
    setDiscount(finalDiscount);
  };

  const discountKeypad = useNumericKeypad({
    onConfirm: updateDiscount,
    initialValue: discountValue,
    title: 'Cart Discount',
    maxLength: 6,
    allowDecimal: true,
  });

  // Clear selected items when cart changes
  useEffect(() => {
    setSelectedItems([]);
  }, [products]);

  const removeFromCart = (product: OrderProduct) => {
    removeProduct(product);
    setSelectedItems(selectedItems.filter((id) => !(id === product._uuid)));
  };

  const updateQuantity = (product: OrderProduct, quantity: number) => {
    const quantities = product.$quantities ? product.$quantities() : null;
    const availableQuantity = quantities?.quantity || 999999;

    if (availableQuantity > 0 && quantity > availableQuantity) {
      toast.warning('Not enough stock. Available: ' + availableQuantity);
      return;
    }

    if (quantity <= 0) {
      removeFromCart(product);
    } else {
      const lineSubtotal = product.unit_price * quantity;
      const discount_value =
        product.discount_type === 'percentage' ? ((product.discount_percentage || 0) / 100) * lineSubtotal : product.discount || 0;

      const total_price = product.unit_price * quantity;
      const totalBeforeTax = total_price - discount_value;

      let totalTaxValue = 0;
      const taxRate = product.price_without_tax > 0 ? product.tax_value / product.price_without_tax : 0;

      if (product.tax_type === 'exclusive') {
        totalTaxValue = totalBeforeTax * taxRate;
      } else if (product.tax_type === 'inclusive') {
        const taxMultiplier = 1 + taxRate;
        const priceWithTax = totalBeforeTax;
        const priceWithoutTax = priceWithTax / taxMultiplier;
        totalTaxValue = priceWithTax - priceWithoutTax;
      }

      const total_price_with_tax = totalBeforeTax + totalTaxValue;
      const total_price_without_tax = totalBeforeTax;

      updateProduct(product, {
        discount: discount_value,
        quantity,
        total_tax_value: totalTaxValue,
        total_price: options.ns_jgrem_price_with_tax === 'yes' ? total_price_with_tax : total_price_without_tax,
        total_price_with_tax,
        total_price_without_tax,
      });
    }
  };

  const updateProductPrice = (product: OrderProduct, price: number) => {
    const discount_value = ((product.discount_percentage || 0) / 100) * price * product.quantity;
    const newTaxValue = calculateNewTaxValue(product.price_without_tax, product.tax_value, price).newTaxValue;
    const totalTaxValue = newTaxValue * product.quantity;
    const total_price = price * product.quantity;
    const total_price_with_tax = total_price + totalTaxValue - discount_value;
    const total_price_without_tax = total_price - discount_value;

    updateProduct(product, {
      discount: discount_value,
      unit_price: price,
      price_without_tax: price,
      price_with_tax: price + newTaxValue,
      tax_value: newTaxValue,
      total_tax_value: totalTaxValue,
      mode: 'custom',
      total_price: options.ns_jgrem_price_with_tax === 'yes' ? total_price_with_tax : total_price_without_tax,
      total_price_with_tax,
      total_price_without_tax,
    });
  };

  const updateProductDiscountPercentage = (product: OrderProduct, discount: number) => {
    const total_price = product.price_without_tax * product.quantity;
    const discount_value = (discount / 100) * total_price;
    const total_price_with_tax = product.price_with_tax * product.quantity - discount_value;
    const total_price_without_tax = total_price - discount_value;

    updateProduct(product, {
      discount_percentage: discount,
      discount: discount_value,
      total_price: options.ns_jgrem_price_with_tax === 'yes' ? total_price_with_tax : total_price_without_tax,
      total_price_without_tax,
      total_price_with_tax,
    });
  };

  const clearCart = () => {
    if (products.length > 0) {
      usePOS.getState().clearCart();
      toast.info('Cart cleared', {
        description: 'All items have been removed from the cart',
      });
    }
  };

  const toggleItemSelection = (productId: string) => {
    if (selectedItems.includes(productId)) {
      setSelectedItems(selectedItems.filter((id) => id !== productId));
    } else {
      setSelectedItems([...selectedItems, productId]);
    }
  };

  const selectAllItems = () => {
    setSelectedItems(products.map((item) => item._uuid || `${item.product_id}-${item.unit_id}`));
  };

  const deselectAllItems = () => {
    setSelectedItems([]);
  };

  const removeSelectedItems = () => {
    if (selectedItems.length === 0) return;

    const productsToRemove = selectedItems;
    productsToRemove.forEach((id) => {
      const product = products.find((p) => (p._uuid || `${p.product_id}-${p.unit_id}`) === id);
      if (product) {
        removeProduct(product);
      }
    });

    toast.success(t('{entries} items removed', { entries: selectedItems.length }), {
      description: t('Selected items have been removed from the cart'),
    });

    setSelectedItems([]);
  };

  const resetCart = () => {
    usePOS.getState().reset();
    setSelectedItems([]);
  };

  const handleSelectUnit = (quantity: string) => {
    if (+quantity < 1) {
      return toast.warning(t('Not enough quantity to proceed.'));
    }

    // if quantity 0 show warning
    // if quanity - existing product quantity show warning
    if (selectedProduct && selectedProduct.product.selectedUnitQuantity) {
      if (selectedProduct.product.selectedUnitQuantity.quantity < parseInt(quantity)) {
        return toast.warning(t('The specified quantity exceed the available quantity.'));
      }

      let quantityInCart = 0;
      products.map((product) => {
        if (product.product_id === selectedProduct.product.id) {
          quantityInCart += product.quantity;
        }
      });

      if (quantityInCart + parseInt(quantity) > selectedProduct.product.selectedUnitQuantity?.quantity) {
        return toast.warning(
          `Unable to add the product, there is not enough stock. Remaining ${selectedProduct.product.selectedUnitQuantity?.quantity - quantityInCart}`,
        );
      }

      addToCart({
        order_id: null,
        product_id: selectedProduct.product.id,
        name: selectedProduct.product.name,
        discount_type: 'percentage',
        discount: 0,
        discount_percentage: 0,
        product_type: selectedProduct.type,
        rate: selectedProduct.product.tax_group.taxes.reduce((acc, tax) => acc + +tax.rate, 0),
        quantity: parseInt(quantity),
        tax_group_id: +(selectedProduct.product.tax_group_id || 0),
        tax_type: selectedProduct.product.tax_type,
        tax_value: selectedProduct.product.selectedUnitQuantity.sale_price_tax,
        unit_id: selectedProduct.product.selectedUnitQuantity.unit.id,
        unit_price: selectedProduct.product.selectedUnitQuantity.sale_price,
        price_with_tax: selectedProduct.product.selectedUnitQuantity.sale_price_with_tax,
        price_without_tax: selectedProduct.product.selectedUnitQuantity.sale_price_without_tax,
        unit_name: selectedProduct.product.selectedUnitQuantity.unit.name,
        total_price:
          options.ns_jgrem_price_with_tax === 'yes'
            ? selectedProduct.product.selectedUnitQuantity.sale_price_with_tax * parseInt(quantity)
            : selectedProduct.product.selectedUnitQuantity.sale_price_without_tax * parseInt(quantity),
        total_price_without_tax: selectedProduct.product.selectedUnitQuantity.sale_price_without_tax * parseInt(quantity),
        total_price_with_tax: selectedProduct.product.selectedUnitQuantity.sale_price_with_tax * parseInt(quantity),
        mode: 'normal',
        unit_quantity_id: selectedProduct.product.selectedUnitQuantity.id,
        total_tax_value: selectedProduct.product.selectedUnitQuantity.sale_price_tax * parseInt(quantity),
        _uuid: `${selectedProduct.product.id}-${selectedProduct.product.selectedUnitQuantity.unit.id}-${Date.now()}`,
      });

      if (isAutoFocusOpen && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }
  };

  const quantityKeypad = useNumericKeypad({
    onConfirm: handleSelectUnit,
    initialValue: '',
    title: 'Define Quantity',
    maxLength: 6,
    allowDecimal: true,
  });

  const handleBarcodeScanned = async (barcode: string) => {
    // /api/products/search/using-barcode/123-466-498-9
    // console.log(barcode);
    try {
      const res = await axios.get<ProductSearchBarcode>(`/api/products/search/using-barcode/${barcode}`);
      if (res.data) {
        setSelectedProduct(res.data);
        quantityKeypad.openKeypad();
      }
    } catch (error) {
      console.log(error);
      toast.error(t('An unexpected error has occurred.'));
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    selectCustomer(customer);
    setShowSelectCustomerDialog(false);
  };

  const onViewCustomer = () => {
    setShowSelectCustomerDialog(false);
    setShowSelectedCustomerDetailsDialog(true);
  };

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

  useDebouncedEffect(
    () => {
      if (isAutoFocusOpen && searchQuery.trim() !== '') {
        handleBarcodeScanned(searchQuery);
        setSearchQuery('');
      }
    },
    [searchQuery],
    300,
  );

  return (
    <div className="flex h-screen w-full flex-col">
      <PrimaryNavigation
        resetCart={() => setIsResetCartOpen(true)}
        handleOpenSelectCustomerDialog={setShowSelectCustomerDialog}
        handleOpenOrderTypeDialog={setShowOrderTypeDialog}
        handleOpenOrderDialog={setShowOrderDialog}
      />
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Cart and Actions */}
        <div className={cn('flex w-1/2 flex-col', isRTL ? 'border-l' : 'border-r')}>
          <SecondaryNavigation setShowSelectCustomerDialog={setShowSelectCustomerDialog} />

          {/* Cart Table */}

          <CartTable
            cart={products}
            removeFromCart={removeProduct}
            updateQuantity={updateQuantity}
            updatePrice={updateProductPrice}
            updateDiscountPercentage={updateProductDiscountPercentage}
            clearCart={clearCart}
            removeSelectedItems={removeSelectedItems}
            selectedItems={selectedItems}
            toggleItemSelection={toggleItemSelection}
            selectAllItems={selectAllItems}
            deselectAllItems={deselectAllItems}
          />

          <TotalsSummary
            subtotal={order.subtotal}
            tax={order.products_tax_value || 0}
            discount={order.discount || 0}
            totalCoupons={order.total_coupons || 0}
            total={order.total || 0}
            customer={order.customer}
            orderType={order.type}
            shipping={order.shipping || 0}
            onOpenDiscountDialog={() => discountKeypad.openKeypad()}
            onOpenShippingDialog={() => setShowShippingDialog(true)}
            onOpenSelectCustomerDialog={() => setShowSelectCustomerDialog(true)}
            onOpenOrderTypeDialog={() => setShowOrderTypeDialog(true)}
          />
          <PaymentActions
            setShowPaymentGatewayDialog={setShowPaymentGatewayDialog}
            setShouldValidate={setShouldValidate}
            useBillingAddress={useBillingAddress}
            useShippingAddress={useShippingAddress}
            resetCart={resetCart}
            onOpenDiscountDialog={() => discountKeypad.openKeypad()}
          />
        </div>

        {/* Right Panel - Products */}
        <div className="flex w-1/2 flex-col">
          <div className="border-b p-2">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Barcode className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  ref={inputRef}
                  type="search"
                  placeholder={t('Search')}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScanned(searchQuery)}
                  onBlur={() => {
                    if (isAutoFocusOpen && inputRef.current) {
                      // Timeout allows the click event on buttons or other elements to complete
                      setTimeout(() => {
                        inputRef.current?.focus();
                      }, 0);
                    }
                  }}
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setIsAutoFocusOpen((prev) => !prev)} title={t('Barcode')}>
                <Barcode className={cn('h-4 w-4', isAutoFocusOpen ? 'text-primary' : '')} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setAutoMerge(!autoMerge)} title={t('Options')}>
                <Shrink className={cn('h-4 w-4', autoMerge ? 'text-primary' : '')} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowSearchProductsDialog(true)} title={t('Products')}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ProductsCategoriesPanel selectedProducts={products} />
        </div>
      </div>

      <SearchProductsDialog open={showSearchProductsDialog} onOpenChange={setShowSearchProductsDialog} onProductSelected={addToCart} />

      <SelectCustomerDialog
        open={showSelectCustomerDialog}
        onOpenChange={() => setShowSelectCustomerDialog(false)}
        selectedCustomer={order.customer}
        handleSelectCustomer={handleSelectCustomer}
        onViewCustomer={onViewCustomer}
      />

      <OrderTypeDialog
        open={showOrderTypeDialog}
        onOpenChange={setShowOrderTypeDialog}
        onSelectOrderType={(orderType) => {
          if (orderType?.identifier === 'delivery') {
            setShowShippingDialog(true);
          }
          if (orderType?.identifier === 'takeaway') {
            usePOS.getState().setShipping(0);
          }
          setOrderType(orderType!);
        }}
        orderType={order.type}
      />

      <CustomerDetailsDialog
        open={showSelectedCustomerDetailsDialog}
        onOpenChange={setShowSelectedCustomerDetailsDialog}
        customer={order.customer}
      />

      <NumericKeypadDialog {...discountKeypad.keypadProps} />

      <ConfirmationDialog
        isOpen={isResetCartOpen}
        onClose={() => setIsResetCartOpen(false)}
        onConfirm={() => {
          resetCart();
          setIsResetCartOpen(false);
        }}
        title={t('Clear All')}
        description={t('Would you like to clear all selected entries ?')}
      />

      <PaymentGatewayDialog
        open={showPaymentGatewayDialog}
        onOpenChange={setShowPaymentGatewayDialog}
        useBillingAddress={useBillingAddress}
        useShippingAddress={useShippingAddress}
        resetCart={resetCart}
      />

      <OrdersDialog open={showOrderDialog} onOpenChange={setShowOrderDialog} />

      <ShippingDialog
        open={showShippingDialog}
        onOpenChange={setShowShippingDialog}
        useBillingAddress={useBillingAddress}
        useShippingAddress={useShippingAddress}
        setUseBillingAddress={setUseBillingAddress}
        setUseShippingAddress={setUseShippingAddress}
        onOpenSelectCustomerDialog={() => setShowSelectCustomerDialog(true)}
      />

      <NumericKeypadDialog {...quantityKeypad.keypadProps} />
    </div>
  );
}
