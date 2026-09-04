import { del, post, put } from './http';

/**
 * Roles API — `/api/crud/sb.roles`
 */
export const rolesApi = {
    /** Create a new role. */
    create: (data: unknown) => post('/crud/sb.roles', data),

    /** Update an existing role. */
    update: (id: number | string, data: unknown) => put(`/crud/sb.roles/${id}`, data),

    /** Delete a single role. */
    remove: (id: number | string) => del(`/crud/sb.roles/${id}`),

    /** Bulk-delete roles by ID. */
    bulkDelete: (ids: Array<number | string>) =>
        post('/crud/sb.roles/bulk-actions', { action: 'delete_selected', entries: ids }),
};
