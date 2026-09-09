import CartTable from '@/components/pos/cart-table';
import PaymentActions from '@/components/pos/payment-actions';
import TotalsSummary from '@/components/pos/totals-summary';
import PrimaryNavigation from '@/components/common/primary-navigation';
import SecondaryNavigation from '@/components/pos/secondary-navigation';
import { isPosOptionEnabled, POS_OPTION_KEYS, isPriceWithTax } from '@/constants/pos-options';
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
import { lazy, Suspense, useRef, useState } from 'react';
import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericKeypadDialog } from '@/components/ui/numeric-keypad-dialog';
import SelectUnitQuantityDialog from './select-unit-quantity-dialog';
import { pickExpressUnit, resolveProductUnitQuantities } from '@/services/product-units';
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
import { canAddBarcodeSilently } from '@/services/pos-defaults';
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
const QuickProductPopup = lazy(() =>
  import('./quick-product-popup').then((m) => ({ default: m.QuickProductPopup })),
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

  // Dialog open-states lifted here so keyboard shortcuts can drive them.
  const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [customerDialogCreateMode, setCustomerDialogCreateMode] = useState(false);

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

  // Unit resolved for the current scan before the quantity keypad opens.
  const scanUnitRef = useRef<UnitQuantity | null>(null);
  const [unitPickerProduct, setUnitPickerProduct] = useState<any>(null);

  const openScanUnitPicker = (product: any): Promise<UnitQuantity | null> => {
    setUnitPickerProduct(product);
    return usePOS.getState().openDialog('unitPicker');
  };

  // Units for a scanned product: the lookup pre-resolves the unit when the
  // barcode matched a unit quantity; otherwise resolve from the payload
  // (unit_quantities is hydrated by the barcode endpoint) or the units API.
  const resolveScanUnits = async (product: any): Promise<UnitQuantity[]> => {
    const scanned = product?.product?.selectedUnitQuantity;
    if (scanned) return [scanned as UnitQuantity];
    return resolveProductUnitQuantities(product?.product);
  };

  const barcodeSearch = useBarcodeSearch({
    onProductFound: (product) => {
      dialogs.setSelectedProduct(product);
      scanUnitRef.current = null;

      // Express scan: with "Show Quantity" off, a scan that already resolved
      // its unit goes straight to the cart with the default quantity (1).
      if (canAddBarcodeSilently(options, product)) {
        addProductWithUnit(product, 1);
        return;
      }

      // A scan matching the product barcode (vs a unit barcode) arrives
      // without a resolved unit — resolve it the same way the categories
      // panel does instead of blindly opening the keypad (whose confirm
      // previously dropped the item silently).
      resolveScanUnits(product).then((units) => {
        if (units.length === 0) {
          toast.error(t('Unable to proceed, no product were provided.'));
          return;
        }

        const resolved = pickExpressUnit(units, options.sb_subul_quick_product_default_unit);

        if (isPosOptionEnabled(options, POS_OPTION_KEYS.showQuantity)) {
          // Quantity requested → resolve the unit first (single unit, the
          // configured default, or the picker), then open the keypad.
          if (product?.product?.selectedUnitQuantity) {
            dialogs.quantityKeypad.openKeypad();
            return;
          }
          if (resolved) {
            scanUnitRef.current = resolved;
            dialogs.quantityKeypad.openKeypad();
            return;
          }
          openScanUnitPicker(product).then((unit) => {
            setUnitPickerProduct(null);
            if (!unit) return;
            scanUnitRef.current = unit;
            dialogs.quantityKeypad.openKeypad();
          });
          return;
        }

        // "Show Quantity" off → default quantity (1), no keypad.
        if (resolved) {
          addProductWithUnit(product, 1, resolved);
          return;
        }
        openScanUnitPicker(product).then((unit) => {
          setUnitPickerProduct(null);
          if (unit) addProductWithUnit(product, 1, unit);
        });
      });
    },
    onProductNotFound: (barcode) => {
      // When quick-product is enabled, open the add dialog directly
      if (options[POS_OPTION_KEYS.quickProduct] === 'yes') {
        dialogs.setPendingBarcode(barcode);
        dialogs.setShowQuickAddProduct(true);
      } else {
        toast.warning(t('Product not found for barcode: {barcode}', { barcode }));
      }
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
    onHold: () => setIsHoldDialogOpen(true),
    onNote: () => setIsCommentsDialogOpen(true),
    onCreateCustomer: () => {
      setCustomerDialogCreateMode(true);
      checkout.setShowSelectCustomerDialog(true);
    },
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

  const addProductWithUnit = (product: ProductSearchBarcode, qty: number, unitOverride?: UnitQuantity) => {
    const selectedUnit = unitOverride ?? product?.product?.selectedUnitQuantity;
    if (!selectedUnit) return;

    const currentInCart = products.reduce(
      (acc, p) => (p.product_id === product.product.id ? acc + p.quantity : acc),
      0,
    );

    const stockCheck = validateStockAvailability(selectedUnit.quantity, qty, currentInCart);
    if (!stockCheck.allowed) {
      toast.warning(t(stockCheck.reason || 'Not enough stock.'));
      return;
    }

    const taxes = product.product.tax_group?.taxes ?? [];
    const rate = taxes.reduce((acc: number, tax) => acc + +(tax as any).rate, 0);

    addToCart({
      order_id: null,
      product_id: product.product.id,
      name: product.product.name,
      discount_type: 'percentage',
      discount: 0,
      discount_percentage: 0,
      product_type: product.type,
      rate,
      quantity: qty,
      tax_group_id: +(product.product.tax_group_id || 0),
      tax_type: product.product.tax_type,
      // The cart engine derives the unit price from `quantities` and the tax
      // split from `source.tax_group` on every recompute (computeProduct →
      // computeProductTaxValue, both `?? 0` when absent) — a line without
      // them is priced at 0 no matter what unit_price says here. The explicit
      // price fields below are initial values only.
      quantities: selectedUnit,
      source: {
        id: product.product.id,
        category_id: (product.product as any).category_id,
        tax_type: product.product.tax_type,
        tax_group: product.product.tax_group ?? null,
      },
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
      _uuid: `${product.product.id}-${selectedUnit.unit.id}-${Date.now()}`,
    });

    if (barcodeSearch.isAutoFocusOpen && barcodeSearch.inputRef.current) {
      setTimeout(() => {
        barcodeSearch.inputRef.current?.focus();
      }, 0);
    }
  };

  const handleSelectUnit = (quantity: string) => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return toast.warning(t('Not enough quantity to proceed.'));
    }

    addProductWithUnit(dialogs.selectedProduct, qty, scanUnitRef.current ?? undefined);
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
        <div className={cn('flex w-1/2 flex-col lg:w-2/5 lg:min-w-[360px]', isRTL ? 'border-l' : 'border-r')}>
          <SecondaryNavigation
            setShowSelectCustomerDialog={checkout.setShowSelectCustomerDialog}
            onOpenQuickAddProductDialog={() => {
              // Clear any barcode left over from the scan-not-found flow so
              // the popup opens without a name prefill, then show it.
              dialogs.setPendingBarcode('');
              dialogs.setShowQuickAddProduct(true);
            }}
            isCommentsDialogOpen={isCommentsDialogOpen}
            onCommentsDialogOpenChange={setIsCommentsDialogOpen}
          />

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
            priceWithTax={isPriceWithTax(options)}
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
            onOpenSelectCustomerDialog={() => checkout.setShowSelectCustomerDialog(true)}
            onOpenOrderTypeDialog={() => checkout.setShowOrderTypeDialog(true)}
            useBillingAddress={checkout.useBillingAddress}
            useShippingAddress={checkout.useShippingAddress}
            resetCart={resetCart}
            onOpenDiscountDialog={() => dialogs.discountKeypad.openKeypad()}
            holdDialogOpen={isHoldDialogOpen}
            onHoldDialogOpenChange={setIsHoldDialogOpen}
          />
        </div>

        {/* Right Panel - Products & Scanner */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b p-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Barcode className="text-muted-foreground absolute top-3 start-2.5 h-4 w-4" />
                <Input
                  ref={barcodeSearch.inputRef}
                  type="search"
                  placeholder={t('Scan barcode or search products...')}
                  className="h-11 ps-9 pe-3"
                  value={barcodeSearch.searchQuery}
                  onChange={(e) => barcodeSearch.setSearchQuery(e.target.value)}
                  onKeyDown={barcodeSearch.handleKeyDown}
                  onBlur={barcodeSearch.handleBlur}
                />
              </div>
              <Button
                variant={barcodeSearch.isAutoFocusOpen ? 'default' : 'outline'}
                size="icon"
                className={cn(
                  'active:scale-95 relative h-11 w-11 transition-all',
                  barcodeSearch.isAutoFocusOpen && 'bg-primary text-primary-foreground shadow-sm',
                )}
                onClick={barcodeSearch.toggleAutoFocus}
                title={
                  barcodeSearch.isAutoFocusOpen
                    ? t('Barcode Autofocus (Active)')
                    : t('Barcode Autofocus (Inactive)')
                }
              >
                <Barcode className="h-5 w-5" />
                {barcodeSearch.isAutoFocusOpen && (
                  <span className="absolute -top-1 -end-1 flex h-3 w-3">
                    <span className="bg-primary/60 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                    <span className="bg-primary relative inline-flex h-3 w-3 rounded-full"></span>
                  </span>
                )}
              </Button>
              <Button
                variant={autoMerge ? 'default' : 'outline'}
                size="icon"
                className={cn(
                  'active:scale-95 relative h-11 w-11 transition-all',
                  autoMerge && 'bg-primary/90 text-primary-foreground',
                )}
                onClick={() => setAutoMerge(!autoMerge)}
                title={
                  autoMerge
                    ? t('Auto Merge Items (Enabled)')
                    : t('Auto Merge Items (Disabled)')
                }
              >
                <Shrink className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="active:scale-95 h-11 w-11 text-muted-foreground hover:text-foreground"
                onClick={() => dialogs.setShowSearchProductsDialog(true)}
                title={t('Quick Search Catalog')}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <ProductsCategoriesPanel />
        </div>
      </div>

      {/* Lazy-loaded Dialogs */}
      <Suspense fallback={null}>
        <SearchProductsDialog
          open={dialogs.showSearchProductsDialog}
          onOpenChange={dialogs.setShowSearchProductsDialog}
          onProductSelected={addToCart}
        />

        {checkout.showSelectCustomerDialog && (
          <SelectCustomerDialog
            open={checkout.showSelectCustomerDialog}
            onOpenChange={() => {
              setCustomerDialogCreateMode(false);
              checkout.setShowSelectCustomerDialog(false);
            }}
            selectedCustomer={order.customer}
            handleSelectCustomer={checkout.handleSelectCustomer}
            onViewCustomer={checkout.openCustomerDetails}
            defaultCreateMode={customerDialogCreateMode}
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

        {dialogs.showQuickAddProduct && (
          <QuickProductPopup
            open={dialogs.showQuickAddProduct}
            onOpenChange={dialogs.setShowQuickAddProduct}
            defaultName={dialogs.pendingBarcode}
          />
        )}
      </Suspense>

      <NumericKeypadDialog {...dialogs.discountKeypad.keypadProps} />
      <NumericKeypadDialog {...dialogs.quantityKeypad.keypadProps} />

      {/* Unit picker for the barcode-scan flow (own store key so it can run
          alongside the categories-panel picker). */}
      <SelectUnitQuantityDialog selectProduct={unitPickerProduct} dialogKey="unitPicker" />

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
