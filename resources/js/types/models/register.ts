import type { Order } from './order';

export interface Register {
  id?: number;
  name?: string;
  status?: 'opened' | 'closed' | 'disabled' | 'in-use' | string;
  description?: string;
  used_by?: number;
  author?: number;
  balance?: number;
  uuid?: string;
  created_at?: string;
  updated_at?: string;
  status_label?: string;
  opening_balance?: number;
  total_sale_amount?: number;
}

export interface RegisterHistory {
  id?: number;
  register_id?: number;
  action?: 'opening' | 'closing' | 'cash-in' | 'cash-out' | string;
  value?: number;
  author?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ZReportCategoryBreakdown {
  name: string;
  quantity: number;
  id?: number;
}

export interface ZReportProductBreakdown {
  name: string;
  total_price: number;
  quantity: number;
  tax_value: number;
  discount: number;
  id?: number;
}

export interface ZReportPaymentBreakdown {
  identifier: string;
  total_amount: number;
  label: string;
}

export interface ZReport {
  register: Register;
  opening?: RegisterHistory;
  closing?: RegisterHistory | null;
  openedOn: string;
  closedOn: string;
  histories?: RegisterHistory[];
  orders?: Order[];
  openingBalance: number;
  closingBalance: number;
  difference: number;
  totalGrossSales: number;
  totalDiscounts: number;
  totalShippings: number;
  totalTaxes: number;
  totalSales: number;
  categories: ZReportCategoryBreakdown[];
  cashier: string;
  sessionDuration: string;
  payments: ZReportPaymentBreakdown[];
  cashOnHand: number;
  products: ZReportProductBreakdown[];
  user?: {
    id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
}
