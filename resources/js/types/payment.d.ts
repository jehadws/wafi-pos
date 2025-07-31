type PaymentTypes = "bank-payment" | "cash-payment" | "customer-payment"

type TPaymentMethod = {
  value: number
  identifier: PaymentTypes
  selected: boolean
  label: string
  readonly: boolean
}

type TOrder = {
  id: number
  description: null | string
  code: string
  title: string | null
  type: "takeaway" | "delivery"
  payment_status: "hold" | "paid" | "unpaid"
  process_status: "not-available",
  delivery_status: "not-available",
  discount: number,
  discount_type: "flat" | "percentage"
  support_instalments: number
  discount_percentage: number
  shipping: number
  shipping_rate: number
  shipping_type: "flat" | "percentage"
  total_without_tax: number
  subtotal: number
  total_with_tax: number
  total_coupons: number
  total_cogs: number
  total: number
  tax_value: number
  products_tax_value: number
  tax_group_id: null | number,
  tax_type: "0",
  tendered: number
  change: number
  final_payment_date: null,
  total_instalments: number
  customer_id: number
  note: null | string,
  note_visibility: "hidden" | "visible",
  author: number
  uuid: null | string
  register_id: null | number
  voidance_reason: null | string,
  created_at: string,
  updated_at: string,
  customer_username: string,
  customer_first_name: string
  customer_last_name: string
  user_username: string
  $checked: boolean
  $toggled: boolean
}

type TOrderProducts = {
  id: 30,
  name: "orange juices",
  unit_name: "piece",
  mode: "normal",
  product_type: "product",
  product_id: 7,
  order_id: 24,
  unit_id: 2,
  unit_quantity_id: 9,
  product_category_id: 6,
  procurement_product_id: null,
  tax_group_id: 1,
  tax_type: "exclusive",
  uuid: null,
  status: "sold",
  return_observations: null,
  return_condition: null,
  discount_type: "percentage",
  discount: 0,
  quantity: 5,
  discount_percentage: 0,
  unit_price: 3,
  price_with_tax: 4.2,
  price_without_tax: 3,
  wholesale_tax_value: 0,
  sale_tax_value: 0,
  tax_value: 6,
  rate: 0,
  total_price: 15,
  total_price_with_tax: 21,
  total_price_without_tax: 15,
  total_purchase_price: 60,
  created_at: "2025-07-13T03:44:21.000000Z",
  updated_at: "2025-07-13T03:44:21.000000Z",
  unit: {
    id: 2,
    name: "piece",
    identifier: "piece",
    description: null,
    author: 72,
    group_id: 2,
    value: 1,
    preview_url: null,
    base_unit: true,
    uuid: null,
    created_at: "2025-05-19T12:16:35.000000Z",
    updated_at: "2025-05-19T12:16:35.000000Z"
  }
}

type PaginatedOrders = {
  data: TOrder[],
  page: number,
  lastPage: number
}
