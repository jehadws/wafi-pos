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
  const inputRef = useRef<HTMLInputElement>(null);
  const [discount, setDiscount] = useState(0)



  useEffect(() => {
    if (isAutoFocusOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAutoFocusOpen]);



  const form = useForm<OrderFormValuesType>({
    discount_type: null,
    title: "",
    created_at: "",
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
    total_products: 0,
    shipping: 0,
    tax_value: 0,
    products_tax_value: 0,
    shipping_rate: 0,
    type: {
      identifier: "takeaway",
      label: "Take Away",
      icon: "/images/groceries.png",
      selected: true
    },
    products: [],
    instalments: [],
    payments: [],
    customer: null,
  })

  const updateDiscount = (discount: string) => {
    setDiscount(+discount)
    form.setData("discount", +discount)
    form.setData("discount_percentage", (+discount / form.data.total) * 100)
  }

  const discountKeypad = useNumericKeypad({
    onConfirm: updateDiscount,
    initialValue: discount,
    title: "Define Quantity",
    maxLength: 6,
    allowDecimal: false,
  })

  // ##########################
  // #### Cart management ####
  // #########################

  // Clear selected items when cart changes
  useEffect(() => {
    setSelectedItems([])
  }, [form.data.products])


  const addToCart = async (product: CartProduct) => {
    if (!autoMarge) {
      form.setData('products', [...form.data.products, product])
      return
    }

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

  const removeFromCart = (product: CartProduct) => {
    form.setData('products', form.data.products.filter((item) => !(item._uuid === product._uuid)))
    setSelectedItems(selectedItems.filter((id) => !(id === product._uuid)
    ))
  }

  const updateQuantity = (product: CartProduct, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(product)
      return
    }

    form.setData('products', form.data.products.map((item) => (item._uuid === product._uuid ? { ...item, quantity } : item)))
  }


  const updateProductPrice = (product: CartProduct, price: number) => {
    form.setData('products', form.data.products.map((item) => (item._uuid === product._uuid ? { ...item } : item)))
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
    // setSelectedItems(cart.map((item) => item.product_id))

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

  const calcSubtotal = () => {
    return form.data.products.reduce((sum, item) => sum + item.price_with_tax * item.quantity, 0)
  }

  const calcTax = () => {
    return form.data.products.reduce((sum, item) => sum + item.tax_value * item.quantity, 0)
  }

  const subtotal = calcSubtotal()
  const tax = calcTax()
  const total = subtotal - discount

  const handleBarcodeScanned = (barcode: string) => {
    console.log(barcode)
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


  return (
    <div className="flex h-screen flex-col">
      <PrimaryNavigation
        resetCart={resetCart}
        handleOpenSelectCustomerDialog={setShowSelectCustomerDialog}
        handleOpenOrderTypeDialog={setShowOrderTypeDialog}
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
              clearCart={clearCart}
              removeSelectedItems={removeSelectedItems}
              selectedItems={selectedItems}
              toggleItemSelection={toggleItemSelection}
              selectAllItems={selectAllItems}
              deselectAllItems={deselectAllItems}
            />
          </div>

          <TotalsSummary
            subtotal={subtotal}
            tax={tax}
            discount={discount}
            onOpenDiscountDialog={() => discountKeypad.openKeypad()}
            total={total}
            customer={form.data.customer}
            orderType={form.data.type}
          />
          <PaymentActions />
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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

      <CustomerDetailsDialog
        open={showSelectedCustomerDetailsDialog}
        onOpenChange={setShowSelectedCustomerDetailsDialog}
        customer={form.data.customer}
      />

      <OrderTypeDialog
        open={showOrderTypeDialog}
        onOpenChange={setShowOrderTypeDialog}
        onSelectOrderType={(orderType) => {
          form.setData('type', orderType)
        }}
        orderType={form.data.type}
      />

      <NumericKeypadDialog {...discountKeypad.keypadProps} />
    </div>
  )
}


// form data
// discount_type: null,
// title: "",
// discount: 0,
// discount_percentage: 0,
// subtotal: 79.99999997,
// total: 79.99999997,
// coupons: [],
// total_coupons: 0,
// tendered: 79.99999997,
// note: "",
// note_visibility: "hidden",
// tax_group_id: null,
// tax_type: false,
// taxes: [],
// tax_group: {},
// payment_status: "paid",
// customer_id: 73,
// change: 0,
// total_products: 1,
// shipping: 0,
// tax_value: 0,
// products_tax_value: 7.272727270000004,
// shipping_rate: 0,
// customer: {
//   id: 73,
//   username: "jehad.a6k@gmail.com",
//   active: 0,
//   author: 72,
//   email: "jehad.a6k@gmail.com",
//   password: "$2y$10$xdHSnYk9OQD6eAG6NYsdGubeU3Es7khWyWvsJaanK8m3RuoAhS89.",
//   group_id: 1,
//   first_name: "Jehad Abdulwafi",
//   last_name: null,
//   gender: null,
//   phone: "4411346792",
//   pobox: null,
//   activation_expiration: null,
//   total_sales_count: 0,
//   total_sales: 0,
//   birth_date: "2025-05-19 13:29:25",
//   purchases_amount: 489.99999994,
//   owed_amount: 0,
//   credit_limit_amount: 0,
//   account_amount: 0,
//   activation_token: null,
//   remember_token: null,
//   created_at: "2025-05-19T12:29:39.000000Z",
//   updated_at: "2025-06-26T09:49:17.000000Z",
//   billing: {
//     customer_id: 73,
//     type: "billing",
//     email: null,
//     first_name: null,
//     last_name: null,
//     phone: null,
//     address_1: null,
//     address_2: null,
//     country: null,
//     city: null,
//     pobox: null,
//     company: null,
//     uuid: null,
//     author: 72,
//     created_at: "2025-05-19T12:29:39.000000Z",
//     updated_at: "2025-05-19T12:29:39.000000Z"
//   },
//   shipping: {
//     id: 1,
//     customer_id: 73,
//     type: "shipping",
//     email: null,
//     first_name: null,
//     last_name: null,
//     phone: null,
//     address_1: null,
//     address_2: null,
//     country: null,
//     city: null,
//     pobox: null,
//     company: null,
//     uuid: null,
//     author: 72,
//     created_at: "2025-05-19T12:29:39.000000Z",
//     updated_at: "2025-05-19T12:29:39.000000Z"
//   },
//   group: {
//     id: 1,
//     name: "Jehad Abdulwafi",
//     description: null,
//     reward_system_id: null,
//     minimal_credit_payment: 0,
//     author: 72,
//     uuid: null,
//     created_at: "2025-05-19T12:29:37.000000Z",
//     updated_at: "2025-05-19T12:29:37.000000Z"
//   },
//   selected: true
// },
// type: {
//   identifier: "takeaway",
//   label: "Take Away",
//   icon: "/images/groceries.png",
//   selected: true
// },
// products: [
//   {
//     product_id: 7,
//     name: "orange juices",
//     discount_type: "percentage",
//     discount: 0,
//     discount_percentage: 0,
//     product_type: "product",
//     rate: 0,
//     quantity: 1,
//     tax_group_id: 1,
//     tax_type: "inclusive",
//     tax_value: 7.272727270000004,
//     unit_id: 0,
//     unit_price: 72.7272727,
//     price_with_tax: 79.99999997,
//     price_without_tax: 72.7272727,
//     unit_name: "piece",
//     total_price: 72.7272727,
//     total_price_without_tax: 72.7272727,
//     total_price_with_tax: 79.99999997,
//     mode: "normal",
//     unit_quantity_id: 9,
//     total_tax_value: 7.272727270000004
//   }
// ],
// instalments: [],
// payments: [
//   {
//     value: 79.99999997,
//     identifier: "cash-payment",
//     selected: false,
//     label: "Cash",
//     readonly: false
//   }
// ],
// addresses: {
//   billing: {
//     customer_id: 73,
//     type: "billing",
//     email: null,
//     first_name: null,
//     last_name: null,
//     phone: null,
//     address_1: null,
//     address_2: null,
//     country: null,
//     city: null,
//     pobox: null,
//     company: null,
//     uuid: null,
//     author: 72,
//     created_at: "2025-05-19T12:29:39.000000Z",
//     updated_at: "2025-05-19T12:29:39.000000Z"
//   }
// }
//
