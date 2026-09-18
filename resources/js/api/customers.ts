import { get, post, put } from './http';

/**
 * Customers API — `/api/customers/*`, `/api/customers-groups`
 *
 * `Customer` / `CustomerOrder` refer to the ambient global declarations
 * in types/module.d.ts. Row deletes/bulk-deletes are backend-driven (crud
 * table engine); these helpers serve the POS dialogs, the customer form
 * pages and the reports.
 */
export const customersApi = {
  /** Fetch a single customer. */
  get: (id: number | string) => get<Customer>(`/customers/${id}`),

  /** Fetch a customer's order history. */
  getOrders: (id: number | string) => get<CustomerOrder[]>(`/customers/${id}/orders`),

  /** Fetch the group a customer belongs to. */
  getGroup: (id: number | string) => get(`/customers/${id}/group`),

  /** Fetch recently active customers (POS quick select). */
  getRecentlyActive: () => get<Customer[]>('/customers/recently-active'),

  /** Search customers by name / phone / email. */
  search: (query: string) => post<Customer[]>('/customers/search', { search: query }),

  /** Fetch all customer groups. */
  getGroups: () => get('/customers-groups'),

  /** Load / apply a coupon code for a customer. */
  applyCoupon: (couponCode: string, customerId: number) => post(`/customers/coupons/${couponCode}`, { customer_id: customerId }),

  // ── CRUD — sb.customers ─────────────────────────────────────────────────

  /** Create a new customer. */
  create: (data: unknown) => post('/crud/sb.customers', data),

  /** Update an existing customer. */
  update: (id: number | string, data: unknown) => put(`/crud/sb.customers/${id}`, data),
};
