import { Address } from './address';
import { Customer } from './customer';
import { OrderProduct } from './order-product';
import { OrderType } from './order-type';
import { Payment } from './payment';
import { TaxGroup, TaxItem } from './tax';

export interface OrderRefundedProduct {
  product?: { name?: string };
  quantity: number;
  unit?: { name?: string };
  condition?: string;
  total_price: number;
  created_at: string;
}

export interface Order {
  id?: number;
  code?: string;
  created_at?: string;
  updated_at?: string;
  discount_type: 'flat' | 'percentage' | null;
  discount: number;
  discount_percentage: number;
  register_id: number | undefined;
  total: number;
  tendered: number;
  payment_status: 'hold' | 'paid' | 'unpaid' | 'partially_paid' | 'layaway' | undefined;
  change: number;
  total_products: number;
  customer: Customer | undefined;
  /** Cashier relation, loaded by `OrdersController::orderReceipt/orderInvoice`. */
  user?: { id?: number; username?: string };
  coupons: {
    code?: string;
    type?: 'percentage_discount' | 'flat_discount';
    name: string;
    customer_coupon_id?: number;
    limit_usage?: number;
    minimum_cart_value?: number;
    maximum_cart_value?: number;
    customer_id?: number;
    value?: number;
    created_at?: string;
    usage?: number;
    active?: number;
    author?: number;
    products?: {
      product_id?: number;
      coupon_id?: number;
      product?: {
        name?: string;
        id?: number;
      };
    }[];
    categories?: {
      category_id?: number;
      coupon_id?: number;
      category?: {
        name?: string;
        id?: number;
      };
    }[];
    discount_value?: number;
  }[];
  total_coupons: number;
  type: OrderType | undefined;
  customer_id: number | undefined;
  products: OrderProduct[];
  payments: Payment[];
  instalments?: { date: string; amount: number; paid?: boolean }[];
  note: string;
  note_visibility: 'hidden' | 'visible';
  tax_group_id?: number;
  tax_type: 'inclusive' | 'exclusive' | undefined;
  taxes: TaxItem[];
  final_payment_date?: string;
  total_instalments?: number;
  addresses: {
    shipping?: Address | Partial<Address>;
    billing?: Address | Partial<Address>;
  };
  tax_value: number;
  products_tax_value: number;
  tax_group: TaxGroup;
  shipping: number;
  shipping_rate: number;
  shipping_type: 'flat' | 'percentage' | undefined;
  subtotal: number;
  title: string;
  refunded_products?: OrderRefundedProduct[];
}

/**
 * Shape of an order returned by the `/api/orders/{id}/pos` endpoint.
 *
 * Differs from `Order` in that:
 * - `type` can be a raw string identifier (e.g. "takeaway"), an `OrderType` object, or null/undefined
 * - `shipping_address` and `billing_address` are top-level relations from Eloquent before
 *   being mapped into `addresses` by `usePOS.loadOrder`
 * - Fields are partial because it merges with `defaultOrder()` on the POS client
 */
export type PosOrder = Partial<Omit<Order, 'type' | 'customer'>> & {
  type?: string | (Partial<OrderType> & { identifier?: string }) | null;
  customer?: Customer | Partial<Customer> | null;
  shipping_address?: Address | Partial<Address> | null;
  billing_address?: Address | Partial<Address> | null;
};
