import { del, post, put } from './http';

/**
 * Rewards System API — `/api/crud/sb.rewards-system`
 */
export const rewardsApi = {
    /** Create a new reward system entry. */
    create: (data: unknown) => post('/crud/sb.rewards-system', data),

    /** Update an existing reward system entry. */
    update: (id: number | string, data: unknown) => put(`/crud/sb.rewards-system/${id}`, data),

    /** Delete a single reward system entry. */
    remove: (id: number | string) => del(`/crud/sb.rewards-system/${id}`),

    /** Bulk-delete reward system entries by ID. */
    bulkDelete: (ids: Array<number | string>) =>
        post('/crud/sb.rewards-system/bulk-actions', { action: 'delete_selected', entries: ids }),
};
