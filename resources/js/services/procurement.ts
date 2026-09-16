/**
 * services/procurement.ts
 *
 * Pure domain service for procurement calculations and payload mapping.
 * Follows SRP: isolates purchase pricing math and data transforms.
 */

import { getPriceWithTax, getPriceWithoutTax, getVatValue } from '@/services/cart-engine';

export interface ProcurementProductItem {
  id?: number;
  product_id: number;
  name: string;
  purchase_price: number;
  purchase_price_edit?: number;
  gross_purchase_price?: number;
  net_purchase_price?: number | null;
  total_purchase_price: number;
  total_price?: number;
  tax_value?: number | string;
  quantity: number;
  unit_id: number | null;
  unit_group?: number;
  unit_quantities?: any[];
  convert_unit_id?: number | null;
  convert_unit_label?: string | number | null;
  procurement_id?: number | null;
  expiration_date?: any;
  tax_group_id?: number | null;
  tax_type?: 'inclusive' | 'exclusive' | string;
  /** Total rate (sum of the group's tax rates) resolved when the group is picked — used by `calculateLineItemPrices`. */
  tax_rate?: number;
  /** Unique client-side row identity, stable across product_id/id collisions. */
  _key?: string;
  $invalid?: boolean;
  [key: string]: any;
}

/**
 * Calculates updated item prices when unit purchase price or quantity changes.
 */
export function calculateLineItemPrices(item: ProcurementProductItem, field: 'purchase_price' | 'quantity', value: number): ProcurementProductItem {
  const updated = { ...item, [field]: value };
  const price = field === 'purchase_price' ? value : Number(updated.purchase_price || 0);
  const qty = field === 'quantity' ? value : Number(updated.quantity || 0);
  const rate = Number(updated.tax_rate || 0);
  const type = updated.tax_type || 'inclusive';

  updated.purchase_price_edit = price;
  updated.gross_purchase_price = rate > 0 ? getPriceWithTax(price, rate, type) : price;
  updated.net_purchase_price = rate > 0 ? getPriceWithoutTax(price, rate, type) : price;
  updated.total_purchase_price = price * qty;
  updated.total_price = (rate > 0 ? getPriceWithTax(price, rate, type) : price) * qty;
  updated.tax_value = rate > 0 ? getVatValue(price, rate, type) * qty : 0;

  return updated;
}
