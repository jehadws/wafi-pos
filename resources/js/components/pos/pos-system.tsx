import CartTable from '@/components/pos/cart-table';
import PaymentActions from '@/components/pos/payment-actions';
import TotalsSummary from '@/components/pos/totals-summary';
import PrimaryNavigation from '@/components/common/primary-navigation';
import SecondaryNavigation from '@/components/pos/secondary-navigation';
import { POS_OPTION_KEYS, isPriceWithTax } from '@/constants/pos-options';
import { useRegisterStore } from '@/hooks/pos/use-register-store';
import { usePOSShortcuts } from '@/hooks/use-pos-shortcuts';
import { useRTL } from '@/hooks/use-rtl';
import { useShallow } from 'zustand/react/shallow';
import { usePOS } from '@/hooks/usePOS';
import { OrderProduct } from '@/types/models/order-product';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Barcode, Search, Shrink } from 'lucide-react';
import { toast } from 'sonner';
import { lazy, Suspense } from 'react';
import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericKeypadDialog } from '@/components/ui/numeric-keypad-dialog';
import {
    calculateTotalsForDiscountPercentageUpdate,
    calculateTotalsForPriceUpdate,
    calculateTotalsForQuantityUpdate,
} from '@/services/cart-engine';
import ProductsCategoriesPanel from './products-categories-panel';
import {
  useBarcodeSearch,
  useCartSelection,
  usePosCheckout,
  usePosDialogCoordinator,
} from '@/hooks/pos';
import { validateStockAvailability } from '@/services/stock';

// Lazy-loaded dialogs for performance & smaller initial bundle
const CustomerDetailsDialog = lazy(() =>
  import('./customer-details-dialog').then((m) => ({ default: m.CustomerDetailsDialog })),
);
const SelectCustomerDialog = lazy(() =>
  import('./customer-select-dialog').then((m) => ({ default: m.SelectCustomerDialog })),
);
const OrderTypeDialog = lazy(() =>
  import('./order-type-dialog').then((m) => ({ default: m.OrderTypeDialog })),
);
const OrdersDialog = lazy(() =>
  import('./orders-dialog').then((m) => ({ default: m.OrdersDialog })),
);
const PaymentGatewayDialog = lazy(() =>
  import('./payment-gateway-dialog').then((m) => ({ default: m.PaymentGatewayDialog })),
);
const SearchProductsDialog = lazy(() =>
  import('./search-products-dialog').then((m) => ({ default: m.SearchProductsDialog })),
);
const ShippingDialog = lazy(() =>
  import('./shipping-dialog').then((m) => ({ default: m.ShippingDialog })),
);

export default function PosSystem() {
  const {
    products,
    options,
    removeProduct,
    updateProduct,
    addToCart,
    order,
    setDiscount,
    selectCustomer,
    setOrderType,
    setShipping,
    autoMerge,
    setAutoMerge,
    buildProducts,
    refreshCart,
    reset,
  } = usePOS(
    useShallow((s) => ({
      products: s.products,
      options: s.options,
      removeProduct: s.removeProduct,
      updateProduct: s.updateProduct,
      addToCart: s.addToCart,
      order: s.order,
      setDiscount: s.setDiscount,
      selectCustomer: s.selectCustomer,
      setOrderType: s.setOrderType,
      setShipping: s.setShipping,
      autoMerge: s.autoMerge,
      setAutoMerge: s.setAutoMerge,
      buildProducts: s.buildProducts,
      refreshCart: s.refreshCart,
      reset: s.reset,
    })),
  );

  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const registersEnabled = options[POS_OPTION_KEYS.registersEnabled] === 'yes';

  // ─── Application Orchestration Hooks ─────────────────────────────────
  const checkout = usePosCheckout({
    order,
    selectCustomer,
    setOrderType,
    setShipping,
  });

  const cartSelection = useCartSelection({
    products,
    onBatchRemove: (remaining) => {
      buildProducts(remaining);
      refreshCart();
    },
  });

  const dialogs = usePosDialogCoordinator({
    onConfirmDiscount: (discount: string) => {
      const finalDiscount = +discount > order.subtotal ? order.subtotal : +discount;
      setDiscount(finalDiscount);
    },
    onConfirmQuantity: (quantity: string) => {
      handleSelectUnit(quantity);
    },
    allowDecimalQuantities: options[POS_OPTION_KEYS.allowDecimalQuantities] ?? true,
  });

  const barcodeSearch = useBarcodeSearch({
    onProductFound: (product) => {
      dialogs.setSelectedProduct(product);
      dialogs.quantityKeypad.openKeypad();
    },
  });

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────
  usePOSShortcuts({
    options,
    autoMerge,
    onPayment: () => checkout.setShowPaymentGatewayDialog(true),
    onCancel: () => dialogs.setIsResetCartOpen(true),
    onShipping: () => checkout.setShowShippingDialog(true),
    onOrderType: () => checkout.setShowOrderTypeDialog(true),
    onQuickSearch: () => dialogs.setShowSearchProductsDialog(true),
    onToggleMerge: () => setAutoMerge(!autoMerge),
  });

  // ─── Cart Operations with Stock Validation ────────────────────────────
  const updateQuantity = (product: OrderProduct, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(product);
      return;
    }

    const quantities = product.quantities ?? null;
    const stockCheck = validateStockAvailability(quantities?.quantity, quantity, 0);

    if (!stockCheck.allowed) {
      toast.warning(t(stockCheck.reason || 'Not enough stock.'));
      return;
    }

    const isPriceWithTaxMode = isPriceWithTax(options);
    const updatedValues = calculateTotalsForQuantityUpdate(
      product,
      quantity,
      isPriceWithTaxMode,
    );
    updateProduct(product, updatedValues);
  };

  const updateProductPrice = (product: OrderProduct, price: number) => {
    const isPriceWithTaxMode = isPriceWithTax(options);
    const updatedValues = calculateTotalsForPriceUpdate(
      product,
      price,
      isPriceWithTaxMode,
    );
    updateProduct(product, updatedValues);
  };

  const updateProductDiscountPercentage = (product: OrderProduct, discount: number) => {
    const isPriceWithTaxMode = isPriceWithTax(options);
    const updatedValues = calculateTotalsForDiscountPercentageUpdate(
      product,
      discount,
      isPriceWithTaxMode,
    );
    updateProduct(product, updatedValues);
  };

  const clearCart = () => {
    if (products.length > 0) {
      usePOS.getState().clearCart();
      toast.info(t('Cart cleared'), {
        description: t('All items have been removed from the cart'),
      });
    }
  };

  const resetCart = () => {
    reset();
    cartSelection.deselectAllItems();
  };

  const handleSelectUnit = (quantity: string) => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return toast.warning(t('Not enough quantity to proceed.'));
    }

    const selectedProduct = dialogs.selectedProduct;
    if (selectedProduct && selectedProduct.product?.selectedUnitQuantity) {
      const selectedUnit = selectedProduct.product.selectedUnitQuantity;
      const currentInCart = products.reduce(
        (acc, p) => (p.product_id === selectedProduct.product.id ? acc + p.quantity : acc),
        0,
      );

      const stockCheck = validateStockAvailability(selectedUnit.quantity, qty, currentInCart);
      if (!stockCheck.allowed) {
        return toast.warning(t(stockCheck.reason || 'Not enough stock.'));
      }

      addToCart({
        order_id: null,
        product_id: selectedProduct.product.id,
        name: selectedProduct.product.name,
        discount_type: 'percentage',
        discount: 0,
        discount_percentage: 0,
        product_type: selectedProduct.type,
        rate: selectedProduct.product.tax_group?.taxes?.reduce(
          (acc: number, tax: any) => acc + +tax.rate,
          0,
        ) || 0,
        quantity: qty,
        tax_group_id: +(selectedProduct.product.tax_group_id || 0),
        tax_type: selectedProduct.product.tax_type,
        tax_value: selectedUnit.sale_price_tax,
        unit_id: selectedUnit.unit.id,
        unit_price: selectedUnit.sale_price,
        price_with_tax: selectedUnit.sale_price_with_tax,
        price_without_tax: selectedUnit.sale_price_without_tax,
        unit_name: selectedUnit.unit.name,
        total_price: isPriceWithTax(options)
          ? selectedUnit.sale_price_with_tax * qty
          : selectedUnit.sale_price_without_tax * qty,
        total_price_without_tax: selectedUnit.sale_price_without_tax * qty,
        total_price_with_tax: selectedUnit.sale_price_with_tax * qty,
        mode: 'normal',
        unit_quantity_id: selectedUnit.id,
        total_tax_value: selectedUnit.sale_price_tax * qty,
        _uuid: `${selectedProduct.product.id}-${selectedUnit.unit.id}-${Date.now()}`,
      });

      if (barcodeSearch.isAutoFocusOpen && barcodeSearch.inputRef.current) {
        setTimeout(() => {
          barcodeSearch.inputRef.current?.focus();
        }, 0);
      }
    }
  };

  return (
    <div className="touch-manipulation flex h-screen w-full select-none flex-col">
      <PrimaryNavigation
        resetCart={() => dialogs.setIsResetCartOpen(true)}
        handleOpenSelectCustomerDialog={checkout.setShowSelectCustomerDialog}
        handleOpenOrderTypeDialog={checkout.setShowOrderTypeDialog}
        handleOpenOrderDialog={dialogs.setShowOrderDialog}
        handleOpenRegisterSession={
          registersEnabled ? () => useRegisterStore.getState().openSessionDialog() : undefined
        }
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Cart and Actions */}
        <div className={cn('flex w-1/2 flex-col', isRTL ? 'border-l' : 'border-r')}>
          <SecondaryNavigation setShowSelectCustomerDialog={checkout.setShowSelectCustomerDialog} />

          {/* Cart Table */}
          <CartTable
            cart={products}
            removeFromCart={removeProduct}
            updateQuantity={updateQuantity}
            updatePrice={updateProductPrice}
            updateDiscountPercentage={updateProductDiscountPercentage}
            clearCart={clearCart}
            removeSelectedItems={cartSelection.removeSelectedItems}
            selectedItems={cartSelection.selectedItems}
            toggleItemSelection={cartSelection.toggleItemSelection}
            selectAllItems={cartSelection.selectAllItems}
            deselectAllItems={cartSelection.deselectAllItems}
          />

          <TotalsSummary
            subtotal={order.subtotal}
            tax={order.products_tax_value || 0}
            discount={order.discount || 0}
            totalCoupons={order.total_coupons || 0}
            total={order.total || 0}
            customer={order.customer as any}
            orderType={order.type}
            shipping={order.shipping || 0}
            onOpenDiscountDialog={() => dialogs.discountKeypad.openKeypad()}
            onOpenShippingDialog={() => checkout.setShowShippingDialog(true)}
            onOpenSelectCustomerDialog={() => checkout.setShowSelectCustomerDialog(true)}
            onOpenOrderTypeDialog={() => checkout.setShowOrderTypeDialog(true)}
          />

          <PaymentActions
            setShowPaymentGatewayDialog={checkout.setShowPaymentGatewayDialog}
            setShouldValidate={checkout.setShouldValidate}
            useBillingAddress={checkout.useBillingAddress}
            useShippingAddress={checkout.useShippingAddress}
            resetCart={resetCart}
            onOpenDiscountDialog={() => dialogs.discountKeypad.openKeypad()}
          />
        </div>

        {/* Right Panel - Products & Scanner */}
        <div className="flex w-1/2 flex-col">
          <div className="border-b p-2">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Barcode className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  ref={barcodeSearch.inputRef}
                  type="search"
                  placeholder={t('Search')}
                  className="pl-8"
                  value={barcodeSearch.searchQuery}
                  onChange={(e) => barcodeSearch.setSearchQuery(e.target.value)}
                  onKeyDown={barcodeSearch.handleKeyDown}
                  onBlur={barcodeSearch.handleBlur}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="active:scale-95 h-11 w-11"
                onClick={barcodeSearch.toggleAutoFocus}
                title={t('Barcode')}
              >
                <Barcode
                  className={cn('h-5 w-5', barcodeSearch.isAutoFocusOpen ? 'text-primary' : '')}
                />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="active:scale-95 h-11 w-11"
                onClick={() => setAutoMerge(!autoMerge)}
                title={t('Options')}
              >
                <Shrink className={cn('h-5 w-5', autoMerge ? 'text-primary' : '')} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="active:scale-95 h-11 w-11"
                onClick={() => dialogs.setShowSearchProductsDialog(true)}
                title={t('Products')}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <ProductsCategoriesPanel selectedProducts={products} />
        </div>
      </div>

      {/* Lazy-loaded Dialogs */}
      <Suspense fallback={null}>
        {dialogs.showSearchProductsDialog && (
          <SearchProductsDialog
            open={dialogs.showSearchProductsDialog}
            onOpenChange={dialogs.setShowSearchProductsDialog}
            onProductSelected={addToCart}
          />
        )}

        {checkout.showSelectCustomerDialog && (
          <SelectCustomerDialog
            open={checkout.showSelectCustomerDialog}
            onOpenChange={() => checkout.setShowSelectCustomerDialog(false)}
            selectedCustomer={order.customer}
            handleSelectCustomer={checkout.handleSelectCustomer as any}
            onViewCustomer={checkout.openCustomerDetails}
          />
        )}

        {checkout.showOrderTypeDialog && (
          <OrderTypeDialog
            open={checkout.showOrderTypeDialog}
            onOpenChange={checkout.setShowOrderTypeDialog}
            onSelectOrderType={checkout.handleSelectOrderType}
            orderType={order.type ?? null}
          />
        )}

        {checkout.showSelectedCustomerDetailsDialog && (
          <CustomerDetailsDialog
            open={checkout.showSelectedCustomerDetailsDialog}
            onOpenChange={checkout.setShowSelectedCustomerDetailsDialog}
            customer={order.customer as any}
          />
        )}

        {checkout.showPaymentGatewayDialog && (
          <PaymentGatewayDialog
            open={checkout.showPaymentGatewayDialog}
            onOpenChange={checkout.setShowPaymentGatewayDialog}
            useBillingAddress={checkout.useBillingAddress}
            useShippingAddress={checkout.useShippingAddress}
            resetCart={resetCart}
          />
        )}

        {dialogs.showOrderDialog && (
          <OrdersDialog
            open={dialogs.showOrderDialog}
            onOpenChange={dialogs.setShowOrderDialog}
          />
        )}

        {checkout.showShippingDialog && (
          <ShippingDialog
            open={checkout.showShippingDialog}
            onOpenChange={checkout.setShowShippingDialog}
            useBillingAddress={checkout.useBillingAddress}
            useShippingAddress={checkout.useShippingAddress}
            setUseBillingAddress={checkout.setUseBillingAddress}
            setUseShippingAddress={checkout.setUseShippingAddress}
            onOpenSelectCustomerDialog={() => checkout.setShowSelectCustomerDialog(true)}
          />
        )}
      </Suspense>

      <NumericKeypadDialog {...dialogs.discountKeypad.keypadProps} />
      <NumericKeypadDialog {...dialogs.quantityKeypad.keypadProps} />

      <ConfirmationDialog
        isOpen={dialogs.isResetCartOpen}
        onClose={() => dialogs.setIsResetCartOpen(false)}
        onConfirm={() => {
          resetCart();
          dialogs.setIsResetCartOpen(false);
        }}
        title={t('Clear All')}
        description={t('Would you like to clear all selected entries ?')}
      />
    </div>
  );
}
