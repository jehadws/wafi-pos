import { Product } from './product';
import { ProductUnitQuantity } from './product-unit-quantity';
import { TaxGroup } from './tax';

/**
 * Serializable snapshot of the catalog product a cart line came from.
 * Replaces the former $original: () => any closure so cart lines stay
 * JSON-serializable (persistence, devtools, structured clone).
 */
export interface OrderProductSource {
  id: number;
  /** Used by coupon category validation. */
  category_id: number;
  tax_type: string;
  tax_group: TaxGroup | null;
}

export interface OrderProduct extends Product {
  tax_value: number;
  tax_group_id: number;
  tax_type: string | undefined;
  unit_id: number;
  unit_name: string | undefined;
  unit_price: number;
  price_with_tax: number;
  price_without_tax: number;
  total_price: number;
  total_price_with_tax: number;
  total_price_without_tax: number;
  total_tax_value?: number;
  product_type: 'product' | 'dynamic';
  rate?: number;
  quantity: number;
  product?: Product;

  /**
   * Serializable per-unit pricing data for this line (the unit quantity
   * row it was added from). Replaces the former $quantities() closure.
   */
  quantities?: ProductUnitQuantity;

  /**
   * Serializable snapshot of the source catalog product.
   * Replaces the former $original() closure.
   */
  source?: OrderProductSource;

  _uuid?: string;
  /** Present when this cart line is tied to a saved order product row */
  order_id?: number | null;
  /** Flat discount amount on this line */
  discount?: number;
  discount_percentage?: number;
  discount_type?: 'percentage' | 'flat';
  unit_quantity_id?: number;
  /** Pricing mode: normal | wholesale | custom */
  mode?: 'normal' | 'wholesale' | 'custom';
}
