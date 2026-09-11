/**
 * services/procurement.ts
 *
 * Pure domain service for procurement calculations and payload mapping.
 * Follows SRP: isolates purchase pricing math and data transforms.
 */

import { getPriceWithTax, getPriceWithoutTax, getVatValue } from '@/services/cart-engine';
import { format } from 'date-fns';

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

export interface ProcurementGeneralData {
  invoice_reference?: string;
  delivery_time: any;
  invoice_date: any;
  automatic_approval: number;
  delivery_status: string;
  payment_status: string;
  provider_id: string | number;
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

/**
 * Formats full procurement form data into the backend API payload contract.
 */
export function buildProcurementPayload(name: string, general: ProcurementGeneralData, products: ProcurementProductItem[]) {
  return {
    name,
    general: {
      invoice_reference: general.invoice_reference || null,
      delivery_time: general.delivery_time ? format(new Date(general.delivery_time), 'yyyy-MM-dd') : '',
      invoice_date: general.invoice_date ? format(new Date(general.invoice_date), 'yyyy-MM-dd') : '',
      automatic_approval: general.automatic_approval,
      delivery_status: general.delivery_status,
      payment_status: general.payment_status,
      provider_id: general.provider_id,
    },
    products: products.map((product) => ({
      // The backend matches existing procurement products by `id`
      // (ProcurementService::saveProducts) — omitting it duplicates rows on edit.
      ...(product.id ? { id: product.id } : {}),
      gross_purchase_price: !Number.isNaN(Number(product.gross_purchase_price)) ? Number(product.gross_purchase_price) : 0,
      purchase_price_edit: !Number.isNaN(Number(product.purchase_price_edit)) ? Number(product.purchase_price_edit) : 0,
      tax_value: !Number.isNaN(Number(product.tax_value)) ? Number(product.tax_value) : 0,
      net_purchase_price: !Number.isNaN(Number(product.net_purchase_price)) ? Number(product.net_purchase_price) : 0,
      purchase_price: !Number.isNaN(Number(product.purchase_price)) ? Number(product.purchase_price) : 0,
      total_price: !Number.isNaN(Number(product.total_price)) ? Number(product.total_price) : 0,
      total_purchase_price: !Number.isNaN(Number(product.total_purchase_price)) ? Number(product.total_purchase_price) : 0,
      quantity: !Number.isNaN(Number(product.quantity)) ? Number(product.quantity).toString() : '0',
      expiration_date: product.expiration_date ? format(new Date(product.expiration_date), 'yyyy-MM-dd HH:mm:ss') : null,
      tax_group_id: product.tax_group_id ? product.tax_group_id : null,
      tax_type: product.tax_type ? product.tax_type : 'inclusive',
      unit_id: product.unit_id,
      product_id: product.product_id,
      convert_unit_id: product.convert_unit_id ? product.convert_unit_id : null,
      procurement_id: product.procurement_id || null,
      $invalid: false,
    })),
  };
}
