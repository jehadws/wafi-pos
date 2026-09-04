type CategoryProduct = {
  author: number
  created_at: string
  description?: string
  displays_on_pos: number
  id: number
  media_id: number
  name: string
  parent_id?: number
  preview_url?: string
  total_items: number
  updated_at: string
  uuid: null | string
}


type Product = {
  id: number
  name: string
  expires: boolean
  on_expiration: "allow_sales" | "prevent_sales"
  product_subitems: any[]
  barcode: string
  barcode_type: string
  category_id: number | undefined
  description: string
  sku: string
  status: "available" | "unavailable"
  stock_management: "enabled" | "disabled"
  type: "materialized" | "dematerialized" | "grouped"
  images: string[]
  tax_group_id: number | string
  tax_type: "inclusive" | "exclusive"
  tax_value: number
  product_type: "product"
  accurate_tracking: boolean
  auto_cogs: boolean
  thumbnail_id: null | string
  parent_id: number
  unit_group: number
  searchable: number
  author: number
  uuid: null | string
  unit_quantities: UnitQuantity[],
  galleries?: { url: string; featured: boolean; name?: string }[],
  created_at: string
  updated_at: string
  quantity?: number
  unit_price?: number | string
  price_with_tax?: number
  condition?: string
  unit?: { name?: string }
}


type ProductSearchResult = {
  id: number,
  name: string,
  tax_type: "inclusive" | "exclusive",
  tax_group_id: null | number,
  tax_value: number,
  product_type: string,
  type: string,
  accurate_tracking: boolean,
  auto_cogs: boolean,
  status: string,
  stock_management: string,
  barcode: string,
  barcode_type: string,
  sku: string,
  description: null | string,
  thumbnail_id: null | string,
  category_id: number,
  parent_id: number,
  unit_group: number,
  on_expiration: string,
  expires: boolean,
  searchable: boolean,
  author: number,
  uuid: null | string,
  created_at: string,
  updated_at: string,
  unit_quantities: UnitQuantity[],
}

type UnitQuantity = {
  id: number,
  product_id: number,
  type: string,
  preview_url: string,
  expiration_date: null,
  unit_id: number,
  barcode: string,
  quantity: number,
  low_quantity: number,
  stock_alert_enabled: number,
  sale_price: number,
  sale_price_edit: number,
  sale_price_without_tax: number,
  sale_price_with_tax: number,
  sale_price_tax: number,
  wholesale_price: number,
  wholesale_price_edit: number,
  wholesale_price_with_tax: number,
  wholesale_price_without_tax: number,
  wholesale_price_tax: number,
  custom_price: number,
  custom_price_edit: number,
  custom_price_with_tax: number,
  custom_price_without_tax: number,
  custom_price_tax: number,
  visible: number,
  convert_unit_id: null | number,
  cogs: number,
  uuid: null | string,
  created_at: string,
  updated_at: string,
  last_purchase_price: number,
  unit: Unit
}


type ProductAdd = {
  product_id: number,
  gross_purchase_price: number,
  purchase_price_edit: number,
  tax_value: number | null,
  net_purchase_price: number | null,
  purchase_price: number,
  total_price: number,
  total_purchase_price: number,
  quantity: number,
  expiration_date: null | string,
  tax_group_id: null | number,
  tax_type: string,
  unit_id: number | null,
  convert_unit_id: null | number,
  procurement_id: null,
  $invalid: boolean,
  convert_unit_label: null | string
} & ProductSearchResult;

type UnitGroup = {
  author: number
  created_at: string
  description?: string
  id: number
  name: string
  updated_at: string
  uuid: null | string
}


type UnitGroupWithUnits = {
  author: number
  created_at: string
  description?: string
  id: number
  name: string
  updated_at: string
  uuid: null | string
  units: Unit[]
}

type Unit = {
  author: number
  id: number
  name: string,
  description: string | null
  group_id: number,
  value: string,
  base_unit: boolean | number,
  identifier: string | null,
  preview_url: string | null,
  uuid: null | string,
  created_at: string,
  updated_at: string
}

type Role = {
  author: number
  created_at: string
  description?: string
  id: number
  name: string
  namespace: string
  updated_at: string
  uuid: null | string
}

type Permission = {
  id: number
  name: string
  namespace: string
  description: string
  created_at: string
  updated_at: string
}

type RoleWithPermissions = {
  author: number
  created_at: string
  description?: string
  id: number
  name: string
  namespace: string
  updated_at: string
  uuid: null | string
  permissions: (Permission | number)[] // Array of permissions or permission IDs
}

type Provider = {
  address_1: string
  address_2: string | null
  amount_due: number
  amount_paid: number
  author: number
  created_at: string
  description: null | string
  email: string
  first_name: string
  id: number
  last_name: string
  phone: string
  updated_at: string
  uuid: string | null
}

type Customer = {
  author: number
  email: string | null
  first_name: string
  gender: "Not Defined" | "male" | "female"
  group_id: number
  group_name: string
  id: number
  last_name: string
  phone: string | null
  billing: Address
  shipping: Address
  created_at: string
  updated_at: string
  group: CustomerGroup
  pobox: string | null
  total_sales_count: number
  total_sales: number
  birth_date: string
  purchases_amount: number
  owed_amount: number
  credit_limit_amount: number
  account_amount: number
}

type OrderType = "takeaway" | "delivery"
type OrderTypeObj = {
  identifier: "takeaway" | "delivery"
  label: string
  icon: string
  selected: boolean
}

type Address = {
  address_1: string | null
  address_2: string | null
  city: string | null
  country: string | null
  customer_id: number | null
  created_at: string | null
  description: string | null
  email: string | null
  first_name: string | null
  id: number | null
  last_name: string | null
  phone: string | null
  updated_at: string | null
  uuid: string | null
  type: "shipping" | "billing"
  pobox: string | undefined
  company: string | undefined
}

type Coupon = {
  id: number
  name: string
  code: string
  type: "percentage_discount" | "flat_discount"
  discount_value: number
  valid_until: string
  maximum_cart_value: number
  minimum_cart_value: number
  valid_hours_end: string
  valid_hours_start: string
  limit_usage: number
  groups_id: null | number
  customers_id: null | number
  author: number
  created_at: string
  updated_at: string
  description: null | string
  products: CouponProduct[],
  categories: CouponCategory[],
  groups: CouponGroup[],
}

type CouponCategory = {
  id: number
  coupon_id: number
  category_id: number
}

type CouponProduct = {
  id: number
  coupon_id: number
  product_id: number
}

type CouponGroup = {
  id: number
  coupon_id: number
  group_id: number
}

type RewardSystem = {
  id: number,
  author: number,
  name: string,
  target: number,
  description: string | null,
  coupon_id: number,
  uuid: null | string,
  created_at: string,
  updated_at: string,
  author_name: string,
  coupon_name: string,
  number_of_rules: number
  rules: RewardRule[]
}

interface RewardSystemRule {
  id: string
  from: number
  to: number
  reward: number
}

type CustomerGroup = {
  id: number,
  author: number,
  name: string,
  minimal_credit_payment: number,
  description: string | null,
  reward_system_id: number,
  uuid: null | string,
  created_at: string,
  updated_at: string,
  author_name: string,
  reward_name: string,
  uuid: null | string,
  reward: RewardSystem
}


type Tax = {
  author: number
  created_at: string
  description: null | string
  id: number
  name: string
  rate: string
  tax_group_id: number
  updated_at: string
  uuid: null | string
}

type TaxGroup = {
  author: number
  created_at: string
  description: null | string
  id: number
  name: string
  updated_at: string
  uuid: null | string
}

type ApiToken = {
  id: number
  tokenable_type: string
  tokenable_id: number
  name: string
  abilities: string[]
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}
type UserAttribute = {
  id: number
  user_id: number
  avatar_link: string
  theme: string
  language: string
}

type Procurement = {
  id: number
  name: string
  provider_id: number
  value: number
  cost: number
  tax_value: number
  invoice_reference: string
  automatic_approval: number
  delivery_time: string
  invoice_date: string
  payment_status: "paid" | "unpaid"
  delivery_status: "pending" | "delivered" | "stocked"
  total_items: number
  description: null | string
  author: number
  uuid: null | string
  created_at: string
  updated_at: string
  author_name: string
  provider: Provider
  provider_name: string
}

type ProcurementProduct = {
  id: number
  name: string
  gross_purchase_price: number
  net_purchase_price: number
  procurement_id: number
  product_id: number
  purchase_price: number
  quantity: number
  available_quantity: number
  tax_group_id: number
  barcode: string
  expiration_date: null | string
  tax_type: "inclusive" | "exclusive"
  tax_value: number
  total_purchase_price: number
  unit_id: number
  convert_unit_id: null | number
  author: number
  uuid: null | string
  created_at: string
  updated_at: string
}




type CustomerOrder = {
  id: number
  code: string
  type: string
  payment_status: string
  process_status: string
  delivery_status: string
  total: number
  created_at: string
  human_status: string
  human_delivery_status: string
  description: string | null,
  title: string | null,
  discount: number,
  discount_type: string,
  support_instalments: boolean,
  discount_percentage: number,
  shipping: number,
  shipping_rate: number,
  shipping_type: string | null,
  total_without_tax: number,
  subtotal: number,
  total_with_tax: number,
  total_coupons: number,
  total_cogs: number,
  tax_value: number,
  products_tax_value: number
  tax_group_id: number | null,
  tax_type: string,
  tendered: number,
  change: number,
  final_payment_date: null | string,
  total_instalments: number,
  customer_id: number,
  note: null | string,
  note_visibility: string,
  author: number
  uuid: null | string
  register_id: null | number,
  voidance_reason: null | string,
  updated_at: string,
}

type OrderInstalment = {
  id: number;
  order_id: number;
  amount: number;
  date: string; // ISO date string e.g. '2025-08-26'
  paid: boolean;
  payment_id: number | null;
};

type PaymentStatus =
  | 'paid'
  | 'partially_paid'
  | 'unpaid'
  | 'hold'
  | 'order_void'
  | 'refunded'
  | 'partially_refunded'
  | 'due'
  | 'partially_due'
  | 'not-available'

type DeliveryStatus =
  | 'pending'
  | 'ongoing'
  | 'error'
  | 'completed'
  | 'delivered'
  | 'not-available'

type ProcessingStatus =
  | 'pending'
  | 'ongoing'
  | 'ready'
  | 'error'
  | 'not-available'

type OrderType =
  | 'takeaway'
  | 'delivery'


type Order = {
  id: number
  description: null | string
  code: string
  title: null | string
  type: OrderType
  payment_status: PaymentStatus
  process_status: ProcessStatus
  delivery_status: DeliveryStatus
  discount: number
  discount_type: "flat" | "percentage",
  support_instalments: boolean
  discount_percentage: number
  shipping: number
  shipping_rate: number
  shipping_type: null | "flat",
  total_without_tax: number
  subtotal: number
  total_with_tax: number
  total_coupons: number
  total_cogs: number
  total: number
  tax_value: number
  products_tax_value: number
  tax_group_id: null | number
  tax_type: string
  tendered: number
  change: number
  final_payment_date: null | string
  total_instalments: number
  customer_id: number
  note: null | string
  note_visibility: "hidden" | "visible"
  author: number
  uuid: null | string
  register_id: null | number
  voidance_reason: null | string,
  created_at: string,
  updated_at: string,
  author_name: string,
  customer: Customer,
  customer_first_name: string,
  instalments?: OrderInstalment[];
  products?: Product[];
  payments?: { label?: string; identifier?: string; value: number }[];
}


interface CustomPaginationData<T> {
  current_page: number
  data: T[]
  next_page_url: string | null
  path: string
  prev_page_url: string | null
  first_page_url: string
  last_page_url: string
  last_page: number
  per_page: number
  from: number
  to: number
  total: number
}

type PaymentType = {
  id: number
  label: string
  identifier: "cash-payment"
  priority: number
  description: null | string
  author: number
  active: number
  readonly: number
  created_at: string
  updated_at: string
  user_username: string
}

type Transaction = {
  id: number
  name: string
  account_id: number
  description: string | null
  media_id: number
  value: string
  recurring: string
  type: string
  active: number
  group_id: null | number
  occurrence: string
  occurrence_value: string
  scheduled_date: null | string
  author: number
  uuid: null | string
  created_at: string
  updated_at: string
  user_username: string
  transactions_accounts_name: string
}

type TransactionHistory = {
  id: number
  name: string
  account_id: number
  description: string | null
  media_id: number
  value: string
  recurring: string
  type: string
  active: number
  group_id: null | number
  occurrence: string
  occurrence_value: string
  scheduled_date: null | string
  author: number
  uuid: null | string
  created_at: string
  updated_at: string
  user_username: string
  transactions_accounts_name: string
  "transaction_id": 1,
  "operation": "credit",
  "is_reflection": 1,
  "reflection_source_id": 1,
  "transaction_account_id": 15,
  "procurement_id": 0,
  "order_refund_id": 0,
  "order_payment_id": null,
  "order_refund_product_id": 0,
  "order_id": 0,
  "order_product_id": 0,
  "register_history_id": 0,
  "customer_account_history_id": 0,
  "name": "Jehad Abdulwafi",
  "type": "sb.direct-transaction",
  "status": "active",
  "value": " 1,00 LYD",
  "trigger_date": "2025-08-16 11:43:21",
  "rule_id": null,
  "author": 76,
  "created_at": "2025-08-16 11:43:21",
  "updated_at": "2025-08-16 11:43:21",
  "transaction_name": "Jehad Abdulwafi",
  "transaction_description": null,
  "transaction_media_id": 0,
  "transaction_value": 1,
  "transaction_recurring": 0,
  "transaction_type": "sb.direct-transaction",
  "transaction_active": 0,
  "transaction_group_id": null,
  "transaction_occurrence": null,
  "transaction_occurrence_value": "0",
  "transaction_scheduled_date": null,
  "transaction_author": 76,
  "transaction_uuid": null,
  "transaction_created_at": "2025-08-16 11:43:17",
  "transaction_updated_at": "2025-08-16 11:43:20",
  "users_id": 76,
  "users_username": "jehad",
  "users_active": 1,
  "users_author": 76,
  "users_email": "hello@jehad.ly",
  "users_password": "$2y$12$Y0.3QfiUbEBI4SFuWbrvweCZNehMmLuLOv5eOt7nvHB9SRzEqbOzK",
  "users_group_id": null,
  "users_first_name": null,
  "users_last_name": null,
  "users_gender": null,
  "users_phone": null,
  "users_pobox": null,
  "users_activation_expiration": null,
  "users_total_sales_count": 16,
  "users_total_sales": 134,
  "users_birth_date": null,
  "users_purchases_amount": 0,
  "users_owed_amount": 0,
  "users_credit_limit_amount": 0,
  "users_account_amount": 0,
  "users_activation_token": null,
  "users_remember_token": null,
  "users_created_at": "2025-05-20 11:30:20",
  "users_updated_at": "2025-08-08 02:51:44",
  "transactions_accounts_name": "Expenses Cash",
  "transactions_accounts_category_identifier": "Assets",
}

type TransactionAccount = {
  id: number
  name: string
  account: string
  sub_category_id: null | string
  category_identifier: string
  description: null | string
  author: number
  uuid: null | string
  subul_users_username: string
  subaccount_name: string
  created_at: string
  updated_at: string
}

type TransactionRule = {
  id: number
  on: string
  action: "increase" | "decrease"
  account_id: number
  do: "increase" | "decrease"
  offset_account_id: number
  locked: number
  created_at: string
  updated_at: string
}

type TransactionActionType = Record<string, string>


type GlobalProductHistory = {
  "id": 45,
  "product_id": 12,
  "procurement_id": null,
  "procurement_product_id": null,
  "order_id": 25,
  "order_product_id": 35,
  "operation_type": "Sold",
  "unit_id": 2,
  "before_quantity": 70,
  "quantity": 5,
  "after_quantity": 65,
  "unit_price": 7,
  "total_price": " 35,00 LYD",
  "description": "",
  "author": 76,
  "uuid": null,
  "created_at": "2025-08-08 02:51:42",
  "updated_at": "2025-08-08 02:51:42",
  "user_id": 76,
  "user_username": "jehad",
  "user_active": 1,
  "user_author": 76,
  "user_email": "hello@jehad.ly",
  "user_password": "$2y$12$Y0.3QfiUbEBI4SFuWbrvweCZNehMmLuLOv5eOt7nvHB9SRzEqbOzK",
  "user_group_id": null,
  "user_first_name": null,
  "user_last_name": null,
  "user_gender": null,
  "user_phone": null,
  "user_pobox": null,
  "user_activation_expiration": null,
  "user_total_sales_count": 16,
  "user_total_sales": 134,
  "user_birth_date": null,
  "user_purchases_amount": 0,
  "user_owed_amount": 0,
  "user_credit_limit_amount": 0,
  "user_account_amount": 0,
  "user_activation_token": null,
  "user_remember_token": null,
  "user_created_at": "2025-05-20 11:30:20",
  "user_updated_at": "2025-08-08 02:51:44",
  "product_name": "pepsi",
  "product_tax_type": "exclusive",
  "product_tax_group_id": 4,
  "product_tax_value": 0,
  "product_product_type": "product",
  "product_type": "materialized",
  "product_accurate_tracking": 0,
  "product_auto_cogs": 1,
  "product_status": "available",
  "product_stock_management": "enabled",
  "product_barcode": "123464894646",
  "product_barcode_type": "code128",
  "product_sku": "pepsi",
  "product_description": null,
  "product_thumbnail_id": null,
  "product_category_id": 10,
  "product_parent_id": 0,
  "product_unit_group": 2,
  "product_on_expiration": "allow_sales",
  "product_expires": 0,
  "product_searchable": 1,
  "product_author": 76,
  "product_uuid": null,
  "product_created_at": "2025-06-26 13:48:39",
  "product_updated_at": "2025-07-07 22:21:45",
  "unit_name": "piece",
  "unit_identifier": "piece",
  "unit_description": null,
  "unit_author": 76,
  "unit_group_id": 2,
  "unit_value": 1,
  "unit_preview_url": null,
  "unit_base_unit": 1,
  "unit_uuid": null,
  "unit_created_at": "2025-05-19 13:16:35",
  "unit_updated_at": "2025-05-19 13:16:35",
  "procurement_name": "N/A",
  "procurement_provider_id": null,
  "procurement_value": null,
  "procurement_cost": null,
  "procurement_tax_value": null,
  "procurement_invoice_reference": null,
  "procurement_automatic_approval": null,
  "procurement_delivery_time": null,
  "procurement_invoice_date": null,
  "procurement_payment_status": null,
  "procurement_delivery_status": null,
  "procurement_total_items": null,
  "procurement_description": null,
  "procurement_author": null,
  "procurement_uuid": null,
  "procurement_created_at": null,
  "procurement_updated_at": null,
  "order_description": null,
  "order_code": "250808-001",
  "order_title": null,
  "order_type": "takeaway",
  "order_payment_status": "paid",
  "order_process_status": "not-available",
  "order_delivery_status": "not-available",
  "order_discount": 0,
  "order_discount_type": "flat",
  "order_support_instalments": 1,
  "order_discount_percentage": 0,
  "order_shipping": 0,
  "order_shipping_rate": 0,
  "order_shipping_type": null,
  "order_total_without_tax": 35,
  "order_subtotal": 35,
  "order_total_with_tax": 35,
  "order_total_coupons": 0,
  "order_total_cogs": 11.285714286,
  "order_total": 35,
  "order_tax_value": 0,
  "order_products_tax_value": 10,
  "order_tax_group_id": null,
  "order_tax_type": "0",
  "order_tendered": 35,
  "order_change": 0,
  "order_final_payment_date": null,
  "order_total_instalments": 0,
  "order_customer_id": 82,
  "order_note": null,
  "order_note_visibility": "hidden",
  "order_author": 76,
  "order_uuid": null,
  "order_register_id": null,
  "order_voidance_reason": null,
  "order_created_at": "2025-08-08 02:51:42",
  "order_updated_at": "2025-08-08 02:51:42",
}
