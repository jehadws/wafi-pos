type CartProduct = {
  product_id: number
  name: string
  discount_type: "percentage" | "fixed"
  discount: number
  discount_percentage: number
  product_type: "product" | string,
  rate: number
  quantity: number
  tax_group_id: number
  tax_type: "inclusive" | "exclusive"
  tax_value: number
  unit_id: number
  unit_price: number
  price_with_tax: number
  price_without_tax: number
  unit_name: string
  total_price: number
  total_price_without_tax: number
  total_price_with_tax: number
  mode: "normal" | string
  unit_quantity_id: number
  total_tax_value: number
  _uuid: string
}


type PaymentCartType = {
  value: number
  identifier: string
  selected: boolean
  label: string
  readonly: boolean
}

type DeliveryType = {
  identifier: string
  label: string
  icon: string
  selected: boolean
}

type OrderFormValuesType = {
  discount_type: string | null,
  title: string
  created_at: string
  discount: number
  discount_percentage: number
  subtotal: number
  total: number
  coupons: Coupon[]
  total_coupons: number
  tendered: number
  note: string
  note_visibility: "hidden" | "visible"
  tax_group_id: null | number
  tax_type: boolean
  taxes: [],
  tax_group: {},
  payment_status: "paid" | "due",
  customer_id: number
  change: number
  total_products: number
  shipping: number
  tax_value: number
  products_tax_value: number
  shipping_rate: number
  type: OrderTypeObj
  products: CartProduct[]
  instalments: [],
  payments: PaymentCartType[]
  customer: Customer | null
}


