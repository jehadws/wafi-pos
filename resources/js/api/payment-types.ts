import { del, post, put } from './http';

/**
 * Payment Types API — `/api/crud/sb.payments-types`
 */
export const paymentTypesApi = {
    /** Create a new payment type. */
    create: (data: unknown) => post('/crud/sb.payments-types', data),

    /** Update an existing payment type. */
    update: (id: number | string, data: unknown) => put(`/crud/sb.payments-types/${id}`, data),

    /** Delete a single payment type. */
    remove: (id: number | string) => del(`/crud/sb.payments-types/${id}`),

    /** Bulk-delete payment types by ID. */
    bulkDelete: (ids: Array<number | string>) =>
        post('/crud/sb.payments-types/bulk-actions', { action: 'delete_selected', entries: ids }),
};
