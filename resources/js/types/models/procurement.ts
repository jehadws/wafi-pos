export interface ProcurementProduct {
  id?: number;
  name?: string;
  gross_purchase_price?: number;
  net_purchase_price?: number;
  procurement_id?: number;
  product_id?: number;
  purchase_price?: number;
  quantity: number;
  available_quantity?: number;
  tax_group_id?: number;
  barcode?: string;
  expiration_date?: string;
  tax_type?: 'inclusive' | 'exclusive';
  tax_value?: number;
  total_purchase_price?: number;
  unit_id?: number;
  convert_unit_id?: number;
  cogs?: number;
  author?: number;
  uuid?: string;
  created_at?: string;
  updated_at?: string;
  product?: {
    id?: number;
    name?: string;
    sku?: string;
    barcode?: string;
  };
  unit?: {
    id?: number;
    name?: string;
  };
}

export interface Procurement {
  id?: number;
  name?: string;
  provider_id?: number;
  value?: number;
  cost?: number;
  tax_value?: number;
  invoice_reference?: string;
  automatic_approval?: boolean;
  delivery_time?: string;
  invoice_date?: string;
  payment_status?: 'unpaid' | 'paid' | string;
  delivery_status?: 'delivered' | 'pending' | 'draft' | 'stocked' | string;
  total_items?: number;
  description?: string;
  author?: number;
  uuid?: string;
  created_at?: string;
  updated_at?: string;
  products?: ProcurementProduct[];
  provider?: {
    id?: number;
    name?: string;
    email?: string;
    phone?: string;
  };
}
