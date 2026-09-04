import { del, get, post, put } from './http';

/**
 * Units API — `/api/units`, `/api/crud/sb.units`, `/api/crud/sb.units-groups`
 */
export const unitsApi = {
    /** Fetch all units. */
    getAll: () => get('/units'),

    // ── CRUD — sb.units ─────────────────────────────────────────────────────

    /** Create a new unit. */
    create: (data: unknown) => post('/crud/sb.units', data),

    /** Update an existing unit. */
    update: (id: number | string, data: unknown) => put(`/crud/sb.units/${id}`, data),

    /** Delete a single unit. */
    remove: (id: number | string) => del(`/crud/sb.units/${id}`),

    /** Bulk-delete units by ID. */
    bulkDelete: (ids: Array<number | string>) =>
        post('/crud/sb.units/bulk-actions', { action: 'delete_selected', entries: ids }),

    // ── CRUD — sb.units-groups ──────────────────────────────────────────────

    /** Create a new unit group. */
    createGroup: (data: unknown) => post('/crud/sb.units-groups', data),

    /** Update an existing unit group. */
    updateGroup: (id: number | string, data: unknown) => put(`/crud/sb.units-groups/${id}`, data),

    /** Delete a single unit group. */
    removeGroup: (id: number | string) => del(`/crud/sb.units-groups/${id}`),

    /** Bulk-delete unit groups by ID. */
    bulkDeleteGroups: (ids: Array<number | string>) =>
        post('/crud/sb.units-groups/bulk-actions', { action: 'delete_selected', entries: ids }),
};
