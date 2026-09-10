import { del, get, post, put } from './http';

/**
 * Procurements API — `/api/procurements/*`, `/api/units-groups/*`,
 * `/api/crud/sb.procurements`, `/api/crud/sb.procurements-products`
 */
export const procurementsApi = {
    /** Search products while building a procurement. */
    searchProduct: (search: string) => post('/procurements/products/search-product', { search }),

    /** Search products and procurements for stock adjustment. */
    searchProcurementProduct: (argument: string) => post('/procurements/products/search-procurement-product', { argument }),

    /** Fetch the units belonging to a unit group. */
    getUnitGroupUnits: (groupId: number | string) => get(`/units-groups/${groupId}/units`),

    // ── CRUD — sb.procurements ──────────────────────────────────────────────

    /** Delete a single procurement. */
    remove: (id: number | string) => del(`/crud/sb.procurements/${id}`),

    /** Bulk-delete procurements by ID. */
    bulkDelete: (ids: Array<number | string>) =>
        post('/crud/sb.procurements/bulk-actions', { action: 'delete_selected', entries: ids }),

    /** Mark a procurement as paid. */
    setAsPaid: (id: number | string) => get(`/procurements/${id}/set-as-paid`),

    /** Change a procurement's payment status (paid | unpaid). */
    changePaymentStatus: (id: number | string, paymentStatus: 'paid' | 'unpaid') =>
        put(`/procurements/${id}/change-payment-status`, { payment_status: paymentStatus }),

    /** Trigger a procurement refresh. */
    refresh: (id: number | string) => get(`/procurements/${id}/refresh`),

    // ── CRUD — sb.procurements-products ────────────────────────────────────

    /** Update a procurement product. */
    updateProduct: (id: number | string, data: unknown) => put(`/crud/sb.procurements-products/${id}`, data),
};
