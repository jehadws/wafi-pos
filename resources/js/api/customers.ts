import { get, post } from './http';

/**
 * Customers API — `/api/customers/*`, `/api/customers-groups`
 *
 * `Customer` / `CustomerOrder` refer to the ambient global declarations
 * in types/module.d.ts.
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
};
