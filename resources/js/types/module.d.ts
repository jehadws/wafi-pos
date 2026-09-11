type CategoryProduct = {
  author: number;
  created_at: string;
  description?: string;
  displays_on_pos: number;
  id: number;
  media_id: number;
  name: string;
  parent_id?: number;
  preview_url?: string;
  total_items: number;
  updated_at: string;
  uuid: null | string;
};

type Product = {
  id: number;
  name: string;
  expires: boolean;
  on_expiration: 'allow_sales' | 'prevent_sales';
  product_subitems: any[];
  barcode: string;
  barcode_type: string;
  category_id: number | undefined;
  description: string;
  sku: string;
  status: 'available' | 'unavailable';
  stock_management: 'enabled' | 'disabled';
  type: 'materialized' | 'dematerialized' | 'grouped';
  images: string[];
  tax_group_id: number | string;
  tax_type: 'inclusive' | 'exclusive';
  tax_value: number;
  product_type: 'product';
  accurate_tracking: boolean;
  auto_cogs: boolean;
  thumbnail_id: null | string;
  parent_id: number;
  unit_group: number;
  searchable: number;
  author: number;
  uuid: null | string;
  unit_quantities: UnitQuantity[];
  galleries?: { url: string; featured: boolean; name?: string }[];
  created_at: string;
  updated_at: string;
  quantity?: number;
  unit_price?: number | string;
  price_with_tax?: number;
  condition?: string;
  unit?: { name?: string };
};

type ProductSearchResult = {
  id: number;
  name: string;
  tax_type: 'inclusive' | 'exclusive';
  tax_group_id: null | number;
  tax_value: number;
  product_type: string;
  type: string;
  accurate_tracking: boolean;
  auto_cogs: boolean;
  status: string;
  stock_management: string;
  barcode: string;
  barcode_type: string;
  sku: string;
  description: null | string;
  thumbnail_id: null | string;
  category_id: number;
  parent_id: number;
  unit_group: number;
  on_expiration: string;
  expires: boolean;
  searchable: boolean;
  author: number;
  uuid: null | string;
  created_at: string;
  updated_at: string;
  unit_quantities: UnitQuantity[];
};

type UnitQuantity = {
  id: number;
  product_id: number;
  type: string;
  preview_url: string;
  expiration_date: null;
  unit_id: number;
  barcode: string;
  quantity: number;
  low_quantity: number;
  stock_alert_enabled: number;
  sale_price: number;
  sale_price_edit: number;
  sale_price_without_tax: number;
  sale_price_with_tax: number;
  sale_price_tax: number;
  wholesale_price: number;
  wholesale_price_edit: number;
  wholesale_price_with_tax: number;
  wholesale_price_without_tax: number;
  wholesale_price_tax: number;
  custom_price: number;
  custom_price_edit: number;
  custom_price_with_tax: number;
  custom_price_without_tax: number;
  custom_price_tax: number;
  visible: number;
  convert_unit_id: null | number;
  cogs: number;
  uuid: null | string;
  created_at: string;
  updated_at: string;
  last_purchase_price: number;
  unit: Unit;
};

type ProductAdd = {
  product_id: number;
  gross_purchase_price: number;
  purchase_price_edit: number;
  tax_value: number | null;
  net_purchase_price: number | null;
  purchase_price: number;
  total_price: number;
  total_purchase_price: number;
  quantity: number;
  expiration_date: null | string;
  tax_group_id: null | number;
  tax_type: string;
  unit_id: number | null;
  convert_unit_id: null | number;
  procurement_id: null;
  $invalid: boolean;
  convert_unit_label: null | string;
} & ProductSearchResult;

type UnitGroup = {
  author: number;
  created_at: string;
  description?: string;
  id: number;
  name: string;
  updated_at: string;
  uuid: null | string;
};

type UnitGroupWithUnits = {
  author: number;
  created_at: string;
  description?: string;
  id: number;
  name: string;
  updated_at: string;
  uuid: null | string;
  units: Unit[];
};

type Unit = {
  author: number;
  id: number;
  name: string;
  description: string | null;
  group_id: number;
  value: string;
  base_unit: boolean | number;
  identifier: string | null;
  preview_url: string | null;
  uuid: null | string;
  created_at: string;
  updated_at: string;
};

type Role = {
  author: number;
  created_at: string;
  description?: string;
  id: number;
  name: string;
  namespace: string;
  updated_at: string;
  uuid: null | string;
};

type Permission = {
  id: number;
  name: string;
  namespace: string;
  description: string;
  created_at: string;
  updated_at: string;
};

type RoleWithPermissions = {
  author: number;
  created_at: string;
  description?: string;
  id: number;
  name: string;
  namespace: string;
  updated_at: string;
  uuid: null | string;
  permissions: (Permission | number)[]; // Array of permissions or permission IDs
};

type Provider = {
  address_1: string;
  address_2: string | null;
  amount_due: number;
  amount_paid: number;
  author: number;
  created_at: string;
  description: null | string;
  email: string;
  first_name: string;
  id: number;
  last_name: string;
  phone: string;
  updated_at: string;
  uuid: string | null;
};

type Customer = {
  author: number;
  email: string | null;
  first_name: string;
  name?: string;
  gender: 'Not Defined' | 'male' | 'female';
  group_id: number;
  group_name: string;
  id: number;
  last_name: string;
  phone: string | null;
  billing: Address;
  shipping: Address;
  created_at: string;
  updated_at: string;
  group: CustomerGroup;
  pobox: string | null;
  total_sales_count: number;
  total_sales: number;
  birth_date: string;
  purchases_amount: number;
  owed_amount: number;
  credit_limit_amount: number;
  account_amount: number;
};

type OrderType = 'takeaway' | 'delivery';
type OrderTypeObj = {
  identifier: 'takeaway' | 'delivery';
  label: string;
  icon: string;
  selected: boolean;
};

type Address = {
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  country: string | null;
  customer_id: number | null;
  created_at: string | null;
  description: string | null;
  email: string | null;
  first_name: string | null;
  id: number | null;
  last_name: string | null;
  phone: string | null;
  updated_at: string | null;
  uuid: string | null;
  type: 'shipping' | 'billing';
  pobox: string | undefined;
  company: string | undefined;
};

type Coupon = {
  id: number;
  name: string;
  code: string;
  type: 'percentage_discount' | 'flat_discount';
  discount_value: number;
  valid_until: string;
  maximum_cart_value: number;
  minimum_cart_value: number;
  valid_hours_end: string;
  valid_hours_start: string;
  limit_usage: number;
  groups_id: null | number;
  customers_id: null | number;
  author: number;
  created_at: string;
  updated_at: string;
  description: null | string;
  products: CouponProduct[];
  categories: CouponCategory[];
  groups: CouponGroup[];
};

type CouponCategory = {
  id: number;
  coupon_id: number;
  category_id: number;
};

type CouponProduct = {
  id: number;
  coupon_id: number;
  product_id: number;
};

type CouponGroup = {
  id: number;
  coupon_id: number;
  group_id: number;
};

type RewardSystem = {
  id: number;
  author: number;
  name: string;
  target: number;
  description: string | null;
  coupon_id: number;
  uuid: null | string;
  created_at: string;
  updated_at: string;
  author_name: string;
  coupon_name: string;
  number_of_rules: number;
  rules: RewardSystemRule[];
};

interface RewardSystemRule {
  id: string;
  from: number;
  to: number;
  reward: number;
}

type CustomerGroup = {
  id: number;
  author: number;
  name: string;
  minimal_credit_payment: number;
  description: string | null;
  reward_system_id: number;
  uuid: null | string;
  created_at: string;
  updated_at: string;
  author_name: string;
  reward_name: string;
  reward: RewardSystem;
};

type Tax = {
  author: number;
  created_at: string;
  description: null | string;
  id: number;
  name: string;
  rate: string;
  tax_group_id: number;
  updated_at: string;
  uuid: null | string;
};

type TaxGroup = {
  author: number;
  created_at: string;
  description: null | string;
  id: number;
  name: string;
  updated_at: string;
  uuid: null | string;
};

type ApiToken = {
  id: number;
  tokenable_type: string;
  tokenable_id: number;
  name: string;
  abilities: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};
type UserAttribute = {
  id: number;
  user_id: number;
  avatar_link: string;
  theme: string;
  language: string;
};

type Procurement = {
  id: number;
  name: string;
  provider_id: number;
  value: number;
  cost: number;
  tax_value: number;
  invoice_reference: string;
  automatic_approval: number;
  delivery_time: string;
  invoice_date: string;
  payment_status: 'paid' | 'unpaid';
  delivery_status: 'pending' | 'delivered' | 'stocked';
  total_items: number;
  description: null | string;
  author: number;
  uuid: null | string;
  created_at: string;
  updated_at: string;
  author_name: string;
  provider: Provider;
  provider_name: string;
};

type ProcurementProduct = {
  id: number;
  name: string;
  gross_purchase_price: number;
  net_purchase_price: number;
  procurement_id: number;
  product_id: number;
  purchase_price: number;
  quantity: number;
  available_quantity: number;
  tax_group_id: number;
  barcode: string;
  expiration_date: null | string;
  tax_type: 'inclusive' | 'exclusive';
  tax_value: number;
  total_purchase_price: number;
  unit_id: number;
  convert_unit_id: null | number;
  author: number;
  uuid: null | string;
  created_at: string;
  updated_at: string;
};

type CustomerOrder = {
  id: number;
  code: string;
  type: string;
  payment_status: string;
  process_status: string;
  delivery_status: string;
  total: number;
  created_at: string;
  human_status: string;
  human_delivery_status: string;
  description: string | null;
  title: string | null;
  discount: number;
  discount_type: string;
  support_instalments: boolean;
  discount_percentage: number;
  shipping: number;
  shipping_rate: number;
  shipping_type: string | null;
  total_without_tax: number;
  subtotal: number;
  total_with_tax: number;
  total_coupons: number;
  total_cogs: number;
  tax_value: number;
  products_tax_value: number;
  tax_group_id: number | null;
  tax_type: string;
  tendered: number;
  change: number;
  final_payment_date: null | string;
  total_instalments: number;
  customer_id: number;
  note: null | string;
  note_visibility: string;
  author: number;
  uuid: null | string;
  register_id: null | number;
  voidance_reason: null | string;
  updated_at: string;
};

type CustomerReward = {
  id: number;
  customer_id: number;
  reward_id: number;
  reward_name: string;
  target: number;
  created_at: string;
  updated_at: string;
};

type CustomerAccountHistory = {
  id: number;
  customer_id: number;
  order_id: null | number;
  amount: number;
  operation: 'add' | 'deduct' | 'payment' | 'refund';
  author: number;
  description: null | string;
  created_at: string;
  updated_at: string;
};

type CustomerCouponRef = {
  id: number;
  code: string;
  author: number;
  coupon_id: number;
  customer_id: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  coupon: Coupon | null;
};

type OrderInstalment = {
  id: number;
  order_id: number;
  amount: number;
  date: string; // ISO date string e.g. '2025-08-26'
  paid: boolean;
  payment_id: number | null;
};

type PaymentStatus =
  'paid' | 'partially_paid' | 'unpaid' | 'hold' | 'order_void' | 'refunded' | 'partially_refunded' | 'due' | 'partially_due' | 'not-available';

type DeliveryStatus = 'pending' | 'ongoing' | 'error' | 'completed' | 'delivered' | 'not-available';

type ProcessingStatus = 'pending' | 'ongoing' | 'ready' | 'error' | 'not-available';

type Order = {
  id: number;
  description: null | string;
  code: string;
  title: null | string;
  type: OrderType;
  payment_status: PaymentStatus;
  process_status: ProcessingStatus;
  delivery_status: DeliveryStatus;
  discount: number;
  discount_type: 'flat' | 'percentage';
  support_instalments: boolean;
  discount_percentage: number;
  shipping: number;
  shipping_rate: number;
  shipping_type: null | 'flat';
  total_without_tax: number;
  subtotal: number;
  total_with_tax: number;
  total_coupons: number;
  total_cogs: number;
  total: number;
  tax_value: number;
  products_tax_value: number;
  tax_group_id: null | number;
  tax_type: string;
  tendered: number;
  change: number;
  final_payment_date: null | string;
  total_instalments: number;
  customer_id: number;
  note: null | string;
  note_visibility: 'hidden' | 'visible';
  author: number;
  uuid: null | string;
  register_id: null | number;
  voidance_reason: null | string;
  created_at: string;
  updated_at: string;
  author_name: string;
  customer: Customer;
  customer_first_name: string;
  instalments?: OrderInstalment[];
  products?: Product[];
  payments?: { label?: string; identifier?: string; value: number }[];
};

interface CustomPaginationData<T> {
  current_page: number;
  data: T[];
  next_page_url: string | null;
  path: string;
  prev_page_url: string | null;
  first_page_url: string;
  last_page_url: string;
  last_page: number;
  per_page: number;
  from: number;
  to: number;
  total: number;
}

type PaymentType = {
  id: number;
  label: string;
  identifier: 'cash-payment';
  priority: number;
  description: null | string;
  author: number;
  active: number;
  readonly: number;
  created_at: string;
  updated_at: string;
  user_username: string;
};

type Transaction = {
  id: number;
  name: string;
  account_id: number;
  description: string | null;
  media_id: number;
  value: string;
  recurring: string;
  type: string;
  active: number;
  group_id: null | number;
  occurrence: string;
  occurrence_value: string;
  scheduled_date: null | string;
  author: number;
  uuid: null | string;
  created_at: string;
  updated_at: string;
  user_username: string;
  transactions_accounts_name: string;
};

type TransactionHistory = {
  id: number;
  name: string;
  account_id: number;
  description: string | null;
  media_id: number;
  value: string;
  recurring: string;
  type: string;
  active: number;
  group_id: null | number;
  occurrence: string;
  occurrence_value: string;
  scheduled_date: null | string;
  author: number;
  uuid: null | string;
  created_at: string;
  updated_at: string;
  user_username: string;
  transactions_accounts_name: string;
  trigger_date: null | string;
};

type TransactionAccount = {
  id: number;
  name: string;
  [key: string]: any;
};

type TransactionRule = {
  id: number;
  on: string;
  account_id: number;
  action: 'increase' | 'decrease';
  do: 'increase' | 'decrease';
  offset_account_id: number;
};

type GlobalProductHistory = {
  product_name: string;
  procurement_name: string;
  order_code: string;
  operation_type: string;
  unit_name: string;
  before_quantity: number;
  quantity: number;
  after_quantity: number;
  total_price: number;
  user_username: string;
  created_at: string;
  [key: string]: any;
};
