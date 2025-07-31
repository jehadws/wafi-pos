import { useState, useEffect, useRef } from "react"
import PrimaryNavigation from "@/components/primary-navigation"
import SecondaryNavigation from "@/components/secondary-navigation"
import CartTable from "@/components/pos/cart-table"
import TotalsSummary from "@/components/pos/totals-summary"
import PaymentActions from "@/components/pos/payment-actions"
import { toast } from "sonner"
import { useForm, usePage } from "@inertiajs/react"
import ProductsCategoriesPanel from "./products-categories-panel"
import { SelectCustomerDialog } from "./customer-select-dialog"
import { OrderTypeDialog } from "./order-type-dialog"
import { CustomerDetailsDialog } from "./customer-details-dialog"
import { Barcode, Search, Shrink } from "lucide-react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { SearchProductsDialog } from "./search-products-dialog"
import { NumericKeypadDialog } from "../ui/numeric-keypad-dialog"
import { useNumericKeypad } from "@/hooks/use-numeric-keypad"
import { PaymentGatewayDialog } from "./payment-gateway-dialog"
import ConfirmationDialog from "../confirmation-dialog"
import { OrdersDialog } from "./orders-dialog"
import { ShippingDialog } from "./shipping-dialog"
import axios from "axios"
import { useDebouncedEffect } from "@/hooks/use-debounced-effect"

function calculateNewTaxValue(
  oldPriceWithoutTax: number,
  oldTaxValue: number,
  newPriceWithoutTax: number
) {
  const taxRate = oldTaxValue / oldPriceWithoutTax;
  const newTaxValue = newPriceWithoutTax * taxRate;

  return {
    taxRate: +(taxRate * 100).toFixed(2),      // percent
    newTaxValue: +newTaxValue.toFixed(2),      // rounded tax value
  };
}

export default function PosSystem() {
  const { categories } = usePage<{ categories: CategoryProduct[] }>().props;
  const [isAutoFocusOpen, setIsAutoFocusOpen] = useState(false)
  const [autoMarge, setAutoMarge] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showSelectCustomerDialog, setShowSelectCustomerDialog] = useState(false)
  const [showSelectedCustomerDetailsDialog, setShowSelectedCustomerDetailsDialog] = useState(false)
  const [showOrderTypeDialog, setShowOrderTypeDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchProductsDialog, setShowSearchProductsDialog] = useState(false)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [showShippingDialog, setShowShippingDialog] = useState(false)
  const [showPaymentGatewayDialog, setShowPaymentGatewayDialog] = useState(false)
  const [isResetCartOpen, setIsResetCartOpen] = useState(false)
  const [useBillingAddress, setUseBillingAddress] = useState(false)
  const [useShippingAddress, setUseShippingAddress] = useState(false)
  const [shouldValidate, setShouldValidate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchBarcode>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [discount, setDiscount] = useState("")

  useEffect(() => {
    if (isAutoFocusOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAutoFocusOpen]);


  const form = useForm<OrderFormValuesType>({
    id: null,
    code: null,
    discount_type: "flat",
    title: "",
    discount: 0,
    discount_percentage: 0,
    subtotal: 0,
    total: 0,
    coupons: [],
    total_coupons: 0,
    tendered: 0,
    note: "",
    note_visibility: "hidden",
    tax_group_id: null,
    tax_type: false,
    taxes: [],
    tax_group: {},
    payment_status: "paid",
    customer_id: 0,
    change: 0,
    addresses: null,
    shipping_type: "flat",
    total_products: 0,
    shipping: 0,
    tax_value: 0,
    products_tax_value: 0,
    shipping_rate: 0,
    type: null,
    products: [],
    instalments: [],
    payments: [],
    customer: null,
  })

  const calcCart = () => {
    const products = form.data.products
    const payments = form.data.payments
    const discount = form.data.discount || 0
    const shipping = form.data.type?.identifier === "takeaway" ? 0 : form.data.shipping

    const subtotal = products.reduce((sum, item) => sum + item.total_price_with_tax, 0)
    const productsTax = products.reduce((sum, item) => sum + item.tax_value * item.quantity, 0)
    const tendered = payments.reduce((sum, item) => sum + item.value, 0)
    const total = subtotal - discount + shipping
    const change = tendered - total

    const total_products = products.length

    form.setData({
      ...form.data,
      subtotal,
      products_tax_value: productsTax,
      total,
      total_products,
      tendered,
      change
    })
  }

  const updateDiscount = (discount: string) => {
    setDiscount("")
    const finalDiscount = +discount > form.data.subtotal ? form.data.subtotal : +discount;
    form.setData("discount", +finalDiscount)
    form.setData("discount_percentage", 0)
  }

  const discountKeypad = useNumericKeypad({
    onConfirm: updateDiscount,
    initialValue: discount,
    title: "Cart Discount",
    maxLength: 6,
    allowDecimal: true,
  })

  // Clear selected items when cart changes
  useEffect(() => {
    setSelectedItems([])
  }, [form.data.products])


  const addToCart = async (product: CartProduct) => {
    if (!autoMarge) {
      form.setData('products', [...form.data.products, product])
    } else {
      const existingIndex = form.data.products.findIndex((p) => p.product_id === product.product_id && p.unit_quantity_id === product.unit_quantity_id)

      if (existingIndex !== -1) {
        const existingProduct = form.data.products[existingIndex]
        const newQuantity = existingProduct.quantity + product.quantity

        const updatedProduct: CartProduct = {
          ...existingProduct,
          quantity: newQuantity,
          total_price: product.unit_price * newQuantity,
          total_price_with_tax: product.price_with_tax * newQuantity,
          total_price_without_tax: product.price_without_tax * newQuantity,
          total_tax_value: product.tax_value * newQuantity,
        }

        const updatedProducts = [...form.data.products]
        updatedProducts[existingIndex] = updatedProduct

        form.setData('products', updatedProducts)
      } else {
        form.setData('products', [...form.data.products, product])
      }
    }
  }

  const removeFromCart = (product: CartProduct) => {
    form.setData('products', form.data.products.filter((item) => !(item._uuid === product._uuid)))
    setSelectedItems(selectedItems.filter((id) => !(id === product._uuid)))

  }

  const updateQuantity = (product: CartProduct, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(product)
      // return
    } else {
      form.setData('products', form.data.products.map((item) => {
        if (item._uuid === product._uuid) {
          const discount_value = (item.discount_percentage / 100) * item.price_without_tax * quantity;
          const total_price = item.price_without_tax * quantity
          const totalTaxValue = item.tax_value * quantity
          return {
            ...item,
            discount: discount_value,
            quantity,
            total_tax_value: totalTaxValue,
            total_price: total_price - discount_value,
            total_price_with_tax: total_price + totalTaxValue - discount_value,
            total_price_without_tax: total_price - discount_value,
          }
        } else {
          return item
        }
      }))
    }
  }

  const updateProductPrice = (product: CartProduct, price: number) => {
    form.setData('products', form.data.products.map((item) => {
      if (item._uuid === product._uuid) {
        const discount_value = (item.discount_percentage / 100) * price * item.quantity;
        const newTaxValue = calculateNewTaxValue(item.price_without_tax, item.tax_value, price).newTaxValue
        const totalTaxValue = newTaxValue * item.quantity
        const total_price = price * item.quantity
        return {
          ...item,
          discount: discount_value,
          unit_price: price,
          price_without_tax: price,
          price_with_tax: price + newTaxValue,
          tax_value: newTaxValue,
          total_tax_value: totalTaxValue,
          total_price: total_price - discount_value,
          total_price_with_tax: total_price + totalTaxValue - discount_value,
          total_price_without_tax: total_price - discount_value,
        }
      } else {
        return item
      }
    }))
  }

  const updateProductDiscountPercentage = (product: CartProduct, discount: number) => {
    form.setData('products', form.data.products.map((item) => {
      if (item._uuid === product._uuid) {
        const total_price = item.price_without_tax * item.quantity;
        const discount_value = (discount / 100) * total_price;
        return {
          ...item,
          discount_percentage: discount,
          discount: discount_value,
          total_price: total_price - discount_value,
          total_price_without_tax: (item.price_without_tax * item.quantity) - discount_value,
          total_price_with_tax: (item.price_with_tax * item.quantity) - discount_value,
        }
      } else {
        return item
      }
    }))
  }

  const clearCart = () => {
    if (form.data.products.length > 0) {
      form.setData('products', [])
      toast.info("Cart cleared", {
        description: "All items have been removed from the cart",
      })
    }
  }

  const toggleItemSelection = (productId: string) => {
    if (selectedItems.includes(productId)) {
      setSelectedItems(selectedItems.filter((id) => id !== productId))
    } else {
      setSelectedItems([...selectedItems, productId])
    }
  }

  const selectAllItems = () => {
    setSelectedItems(form.data.products.map((item) => item._uuid))
  }

  const deselectAllItems = () => {
    setSelectedItems([])
  }

  const removeSelectedItems = () => {
    if (selectedItems.length === 0) return
    form.setData('products', form.data.products.filter((item) => !selectedItems.includes(item._uuid)))

    toast.success(`Removed ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""}`, {
      description: "Selected items have been removed from the cart",
    })

    setSelectedItems([])
  }

  const resetCart = () => {
    form.reset()
    setSelectedItems([])
  }



  const handleSelectUnit = (quantity: string) => {
    if (+quantity < 1) {
      return toast.warning("Quantity cannot be 0")
    }

    // if quantity 0 show warning
    // if quanity - existing product quantity show warning
    if (selectedProduct && selectedProduct.product.selectedUnitQuantity) {
      if (selectedProduct.product.selectedUnitQuantity.quantity < parseInt(quantity)) {
        return toast.warning("Quantity exceeds stock")
      }

      let quantityInCart = 0;
      form.data.products.map((product) => {
        if (product.product_id === selectedProduct.product.id) {
          quantityInCart += product.quantity
        }
      })

      if (quantityInCart + parseInt(quantity) > selectedProduct.product.selectedUnitQuantity?.quantity) {
        return toast.warning(`Unable to add the product, there is not enough stock. Remaining ${selectedProduct.product.selectedUnitQuantity?.quantity - quantityInCart}`)
      }

      addToCart({
        product_id: selectedProduct.product.id,
        name: selectedProduct.product.name,
        discount_type: "percentage",
        discount: 0,
        discount_percentage: 0,
        product_type: selectedProduct.type,
        rate: selectedProduct.product.tax_group.taxes.reduce((acc, tax) => acc + +tax.rate, 0),
        quantity: parseInt(quantity),
        tax_group_id: +selectedProduct.product.tax_group_id,
        tax_type: selectedProduct.product.tax_type,
        tax_value: selectedProduct.product.selectedUnitQuantity.sale_price_tax,
        unit_id: selectedProduct.product.selectedUnitQuantity.unit.id,
        unit_price: selectedProduct.product.selectedUnitQuantity.sale_price,
        price_with_tax: selectedProduct.product.selectedUnitQuantity.sale_price_with_tax,
        price_without_tax: selectedProduct.product.selectedUnitQuantity.sale_price_without_tax,
        unit_name: selectedProduct.product.selectedUnitQuantity.unit.name,
        total_price: selectedProduct.product.selectedUnitQuantity.sale_price * parseInt(quantity),
        total_price_without_tax: selectedProduct.product.selectedUnitQuantity.sale_price_without_tax * parseInt(quantity),
        total_price_with_tax: selectedProduct.product.selectedUnitQuantity.sale_price_with_tax * parseInt(quantity),
        mode: "normal",
        unit_quantity_id: selectedProduct.product.selectedUnitQuantity.id,
        total_tax_value: selectedProduct.product.selectedUnitQuantity.sale_price_tax * parseInt(quantity),
        _uuid: `${selectedProduct.product.id}-${selectedProduct.product.selectedUnitQuantity.unit.id}-${Date.now()}`,
      })


      if (isAutoFocusOpen && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }
  }


  const quantityKeypad = useNumericKeypad({
    onConfirm: handleSelectUnit,
    initialValue: "",
    title: "Define Quantity",
    maxLength: 6,
    allowDecimal: true,
  })

  const handleBarcodeScanned = async (barcode: string) => {
    // /api/products/search/using-barcode/123-466-498-9
    console.log(barcode)
    try {
      const res = await axios.get<ProductSearchBarcode>(`/api/products/search/using-barcode/${barcode}`)
      if (res.data) {
        setSelectedProduct(res.data)
        quantityKeypad.openKeypad()
      }
    } catch (error) {
      console.log(error)
      toast.error("Something went wrong. Please try again.")
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    form.setData('customer', customer)
    form.setData('customer_id', customer.id)
    setShowSelectCustomerDialog(false)
  }

  const onViewCustomer = () => {
    setShowSelectCustomerDialog(false)
    setShowSelectedCustomerDetailsDialog(true)
  }

  useEffect(() => {
    calcCart()
  }, [form.data.products, form.data.discount, form.data.payments, form.data.shipping, form.data.type])

  useEffect(() => {
    if (shouldValidate) {
      if (!form.data.customer || !form.data.customer_id) {
        setShowSelectCustomerDialog(true)
      } else if (!form.data.type) {
        setShowOrderTypeDialog(true)
        setShouldValidate(false)
      }
    }
  }, [shouldValidate, form.data.customer, form.data.customer_id, form.data.type]);

  useDebouncedEffect(() => {
    if (isAutoFocusOpen && searchQuery.trim() !== "") {
      handleBarcodeScanned(searchQuery);
      setSearchQuery("");
    }
  }, [searchQuery], 300);

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
        <div className="flex w-2/3 flex-col border-r">
          <SecondaryNavigation form={form} setShowSelectCustomerDialog={setShowSelectCustomerDialog} />

          {/* Cart Table */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-14 pl-4 border-b bg-muted/50 h-13 text-sm font-medium">
              <div className="col-span-10 inline-flex items-center">Product</div>
              <div className="col-span-2 text-center border-l inline-flex items-center justify-center">Quantity</div>
              <div className="col-span-2 text-center border-l inline-flex items-center justify-center">Total</div>
            </div>

            <CartTable
              cart={form.data.products}
              removeFromCart={removeFromCart}
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

          </div>

          <TotalsSummary
            subtotal={form.data.subtotal}
            tax={form.data.products_tax_value}
            discount={form.data.discount}
            total={form.data.total}
            customer={form.data.customer}
            orderType={form.data.type}
            shipping={form.data.shipping}
            onOpenDiscountDialog={() => discountKeypad.openKeypad()}
            onOpenShippingDialog={() => setShowShippingDialog(true)}
            onOpenSelectCustomerDialog={() => setShowSelectCustomerDialog(true)}
            onOpenOrderTypeDialog={() => setShowOrderTypeDialog(true)}
          />
          <PaymentActions
            form={form}
            setShowPaymentGatewayDialog={setShowPaymentGatewayDialog}
            setShouldValidate={setShouldValidate}
            useBillingAddress={useBillingAddress}
            useShippingAddress={useShippingAddress}
            resetCart={resetCart}
            onOpenDiscountDialog={() => discountKeypad.openKeypad()}
          />
        </div>

        {/* Right Panel - Products */}
        <div className="w-1/3 flex flex-col">
          <div className="border-b p-2">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="search"
                  placeholder="Scan Barcode"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleBarcodeScanned(searchQuery)}
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
              <Button variant="outline" size="icon" onClick={() => setIsAutoFocusOpen(prev => !prev)} title="Scan Barcode">
                <Barcode className={cn("h-4 w-4", isAutoFocusOpen ? "text-primary" : "")} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setAutoMarge(prev => !prev)} title="Auto Marge">
                <Shrink className={cn("h-4 w-4", autoMarge ? "text-primary" : "")} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowSearchProductsDialog(true)} title="Search Products">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ProductsCategoriesPanel
            categories={categories}
            addToCart={addToCart}
            selectedProducts={form.data.products}
          />
        </div>
      </div>

      <SearchProductsDialog
        open={showSearchProductsDialog}
        onOpenChange={setShowSearchProductsDialog}
        onProductSelected={addToCart}
      />

      <SelectCustomerDialog
        open={showSelectCustomerDialog}
        onOpenChange={() => setShowSelectCustomerDialog(false)}
        selectedCustomer={form.data.customer}
        handleSelectCustomer={handleSelectCustomer}
        onViewCustomer={onViewCustomer}
      />

      <OrderTypeDialog
        open={showOrderTypeDialog}
        onOpenChange={setShowOrderTypeDialog}
        onSelectOrderType={(orderType) => {
          if (orderType?.identifier === "delivery") {
            setShowShippingDialog(true)
          }
          if (orderType?.identifier === "takeaway") {
            form.setData('shipping', 0)
          }
          form.setData('type', orderType)
        }}
        orderType={form.data.type}
      />

      <CustomerDetailsDialog
        open={showSelectedCustomerDetailsDialog}
        onOpenChange={setShowSelectedCustomerDetailsDialog}
        customer={form.data.customer}
      />

      <SelectCustomerDialog
        open={showSelectCustomerDialog}
        onOpenChange={() => setShowSelectCustomerDialog(false)}
        selectedCustomer={form.data.customer}
        handleSelectCustomer={handleSelectCustomer}
        onViewCustomer={onViewCustomer}
      />

      <NumericKeypadDialog {...discountKeypad.keypadProps} />

      <ConfirmationDialog
        isOpen={isResetCartOpen}
        onClose={() => setIsResetCartOpen(false)}
        onConfirm={() => {
          resetCart()
          setIsResetCartOpen(false)
        }}
        title="Clear Cart"
        description="Are you sure you want to clear the cart?"
      />

      <PaymentGatewayDialog
        open={showPaymentGatewayDialog}
        onOpenChange={setShowPaymentGatewayDialog}
        form={form}
        useBillingAddress={useBillingAddress}
        useShippingAddress={useShippingAddress}
        resetCart={resetCart}
      />

      <OrdersDialog
        open={showOrderDialog}
        onOpenChange={setShowOrderDialog}
        form={form}
      />

      <ShippingDialog
        open={showShippingDialog}
        onOpenChange={setShowShippingDialog}
        form={form}
        useBillingAddress={useBillingAddress}
        useShippingAddress={useShippingAddress}
        setUseBillingAddress={setUseBillingAddress}
        setUseShippingAddress={setUseShippingAddress}
        onOpenSelectCustomerDialog={() => setShowSelectCustomerDialog(true)}
      />

      <NumericKeypadDialog {...quantityKeypad.keypadProps} />

    </div>
  )
}
