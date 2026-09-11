/**
 * Type definitions for the CartEngine module.
 *
 * These types define the serializable data structures that replace
 * the former closure-based approach ($quantities, $original).
 */

import { Order } from './models/order';
import { OrderProduct } from './models/order-product';
import { TaxGroup } from './models/tax';

/**
 * Serializable snapshot of the catalog product a cart line came from.
 * Replaces the former $original: () => any closure.
 *
 * Populated once at add-to-cart time with the product data needed for:
 * - Tax computation (tax_type, tax_group)
 * - Coupon validation (category_id)
 * - Product identification (id)
 */
export interface OrderProductSource {
  id: number;
  category_id: number;
  tax_type: string;
  tax_group: TaxGroup | null;
}

/**
 * Input to CartEngine.computeCart().
 * Represents a draft cart state ready for computation.
 */
export interface CartDraft {
  products: OrderProduct[];
  coupons: Coupon[];
  order: Order;
}

/**
 * Output from CartEngine.computeCart().
 * Contains fully computed cart with all derived fields populated.
 */
export interface ComputedCart {
  products: OrderProduct[];
  order: Order;
  validCoupons: Coupon[];
  invalidCoupons: Coupon[];
}

/**
 * POS configuration options passed to all cart computation functions.
 *
 * These options control:
 * - Price display mode (with/without tax)
 * - VAT calculation mode (flat, variable, per-product)
 * - Other POS-specific settings
 */
export interface POSOptions {
  /** Whether prices are displayed with tax included */
  sb_subul_price_with_tax: 'yes' | 'no';
  /** VAT calculation mode ('disabled' = no tax anywhere) */
  sb_subul_vat: 'disabled' | 'flat_vat' | 'variable_vat' | 'products_vat';
  /** Allow other POS options as key-value pairs */
  [key: string]: any;
}

/**
 * Coupon definition for validation and discount application.
 */
export interface Coupon {
  id: number;
  name: string;
  code: string;
  type: 'percentage_discount' | 'flat_discount' | 'product_discount';
  value: number;
  /** Products this coupon applies to (empty = all products) */
  products: Array<{ product_id: number }>;
  /** Categories this coupon applies to (empty = all categories) */
  categories: Array<{ category_id: number }>;
  minimum_cart_value?: number;
  maximum_cart_value?: number;
  limit_usage?: number;
  [key: string]: any;
}
