type CartProduct = {
  order_id: number | null
  product_id: number
  name: string
  discount_type: "percentage" | "flat"
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

type DeliveryType = {
  identifier: string
  label: string
  icon: string
  selected: boolean
}

type OrderFormValuesType = {
  id: number | null,
  code: string | null,
  addresses: {
    billing: Address
    shipping: Address
  } | null
  change: number
  coupons: Coupon[]
  customer: Customer | null
  customer_id: number
  discount: number
  discount_percentage: number
  discount_type: "flat" | "percentage",
  instalments: [],
  note: string | null
  note_visibility: "hidden" | "visible"
  payment_status: "paid" | "unpaid",
  payments: TPaymentMethod[]
  products: CartProduct[]
  products_tax_value: number
  shipping: number
  shipping_rate: number
  shipping_type: "flat"
  subtotal: number
  tax_group: {}
  tax_group_id: null | number
  tax_type: boolean | string
  tax_value: number
  taxes: []
  tendered: number
  title: string | null
  total: number
  total_coupons: number
  total_products: number
  shipping_rate: number
  type: OrderTypeObj | null
  // "register_id": null | number,
  // "description": null,
  // "process_status": "not-available",
  // "delivery_status": "not-available",
  // "support_instalments": true,
  // "total_without_tax": 16,
  // "total_with_tax": 16,
  // "total_cogs": 12,
  // "final_payment_date": null,
  // "total_instalments": 0,
  // "author": 72,
  // "uuid": null,
  // "voidance_reason": null,
  // "created_at": "2025-07-13 04:46:09",
  // "updated_at": "2025-07-13 04:46:09"
  // "products": [
  //   CartProduct & {
  //     id: number | null
  //     unit_name: string | null,
  //
  //     unit_quantity_id: number | null
  //     product_category_id: 6,
  //     procurement_product_id: null,
  //     uuid: null,
  //     status: "sold",
  //     return_observations: null,
  //     return_condition: null,
  //     wholesale_tax_value: 0,
  //     sale_tax_value: 0,
  //     tax_value: 1.2000000000000002,
  //     total_purchase_price: 60,
  //     created_at: "2025-07-13T03:46:09.000000Z",
  //     updated_at: "2025-07-13T03:46:09.000000Z",
  //     product: Product & {
  //       tax_group: TaxGroup & {
  //         taxes: Tax[]
  //       },
  //       unit_quantities: UnitQuantity[]
  //     },
  //     unit: Unit
  //     total_tax_value: Number
  //   }
  // ],
}

type ProductSearchBarcode = {
  type: string
  product: ProductSearchResult & {
    selectedUnitQuantity: UnitQuantity
    tax_group: TaxGroup & {
      taxes: Tax[]
    }
  }
}

interface SbPosOptions {
  sb_subul_printing_document: 'invoice' | 'receipt';
  sb_orders_allow_partial: 'yes' | 'no';
  sb_orders_allow_unpaid: 'yes' | 'no';
  sb_subul_order_types: string[]; // from OrdersService::getTypeLabels()
  sb_subul_quick_product: 'yes' | 'no';
  sb_subul_quick_product_default_unit: number; // Unit id
  sb_subul_price_with_tax: 'yes' | 'no';
  sb_subul_unit_price_ediable: 'yes' | 'no';
  sb_subul_printing_enabled_for:
  | 'disabled'
  | 'all_orders'
  | 'partially_paid_orders'
  | 'only_paid_orders';
  sb_subul_registers_enabled: 'yes' | 'no';
  sb_subul_idle_counter: 'disabled' | '5min' | '10min' | '15min' | '20min' | '30min' | number;
  sb_subul_disbursement: 'yes' | 'no';
  sb_customers_default: boolean;
  sb_subul_vat: 'disabled' | 'flat_vat' | 'variable_vat' | 'products_vat';
  sb_subul_tax_group: number | string | null; // TaxGroup id
  sb_subul_tax_type: 'inclusive' | 'exclusive' | false;
  sb_subul_printing_gateway: 'default';
  sb_subul_printing_auto: 'yes' | 'no';
  sb_subul_show_quantity: boolean;
  sb_subul_new_item_audio: '' | 'disabled' | string; // '' or audio URL
  sb_subul_complete_sale_audio: '' | 'disabled' | string;
  sb_subul_numpad: 'default' | 'advanced';
  sb_subul_allow_wholesale_price: boolean;
  sb_subul_allow_decimal_quantities: boolean;
  sb_subul_force_autofocus: boolean;
  sb_subul_items_merge: 'yes' | 'no' | boolean;
  sb_subul_layout: 'grocery_shop' | 'clothing_shop' | string;
}


interface ProductUnitQuantity {
  quantity: number;
  sale_price_tax: number;
  wholesale_price_tax: number;
  custom_price_tax: number;
  expiration_date: string;
  sale_price: number;
  sale_price_edit: number;
  sale_price_without_tax: number;
  sale_price_with_tax: number;
  wholesale_price: number;
  wholesale_price_edit: number;
  wholesale_price_with_tax: number;
  wholesale_price_without_tax: number;
  preview_url: string;
  custom_price: number;
  custom_price_edit: number;
  custom_price_without_tax: number;
  custom_price_with_tax: number;
}


interface Product {
  id?: number;
  name?: string;
  stock_management?: 'enabled' | 'disabled';
  unit_id?: number;
  product_id?: number;
  discount_type?: string;
  discount?: number;
  discount_percentage?: number;
  total_price?: number;
  mode: 'normal' | 'wholesale' | 'custom';
  unit_quantity_id?: number;
  unit_quantities?: any
}
