import { post } from './http';

/** Filters shared by most report endpoints (date range, limits, ...). */
export type ReportFilters = Record<string, unknown>;

/**
 * Reports API — `/api/reports/*`
 */
export const reportsApi = {
  /** Annual report for a given year. */
  annualReport: (year: number | string) => post('/reports/annual-report', { year }),

  /** Recompute the yearly report. */
  computeYearly: (year: number | string) => post('/reports/compute/yearly', { year }),

  /** Statement for a single customer. */
  customersStatement: (customerId: number | string, filters: ReportFilters) => post(`/reports/customers-statement/${customerId}`, filters),

  /** Low stock report. */
  lowStock: (filters: ReportFilters) => post('/reports/low-stock', filters),

  /** Full stock report. */
  stockReport: (filters: ReportFilters) => post('/reports/stock-report', filters),

  /** Payment types report. */
  paymentTypes: (filters: ReportFilters) => post('/reports/payment-types', filters),

  /** Profit report. */
  profitReport: (filters: ReportFilters) => post('/reports/profit-report', filters),

  /** Products (sales progress) report. */
  productsReport: (filters: ReportFilters) => post('/reports/products-report', filters),

  /** Sales report. */
  saleReport: (filters: ReportFilters) => post('/reports/sale-report', filters),

  /** Sold stock report. */
  soldStockReport: (filters: ReportFilters) => post('/reports/sold-stock-report', filters),

  /** Combined product stock history. */
  productHistoryCombined: (filters: ReportFilters) => post('/reports/product-history-combined', filters),

  /** Recompute the combined report. */
  computeCombinedReport: (filters: ReportFilters) => post('/reports/compute-combined-report', filters),

  /** Transactions report. */
  transactions: (filters: ReportFilters) => post('/reports/transactions', filters),
};
