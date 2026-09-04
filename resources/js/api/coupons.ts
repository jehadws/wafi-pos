import { del, post, put } from './http';

/**
 * Coupons API — `/api/crud/sb.coupons`
 */
export const couponsApi = {
    /** Create a new coupon. */
    create: (data: unknown) => post('/crud/sb.coupons', data),

    /** Update an existing coupon. */
    update: (id: number | string, data: unknown) => put(`/crud/sb.coupons/${id}`, data),

    /** Delete a single coupon. */
    remove: (id: number | string) => del(`/crud/sb.coupons/${id}`),

    /** Bulk-delete coupons by ID. */
    bulkDelete: (ids: Array<number | string>) =>
        post('/crud/sb.coupons/bulk-actions', { action: 'delete_selected', entries: ids }),
};
