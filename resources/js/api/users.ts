import { del, get, post, put } from './http';

/**
 * Users API — `/api/users/*`, `/api/crud/sb.users`
 */
export const usersApi = {
    /** Fetch all users. */
    getAll: () => get('/users'),

    /** Fetch the permissions of the currently authenticated user. */
    getPermissions: () => get('/users/permissions/'),

    /** Check whether the current user holds a given permission. */
    checkPermission: (permission: string) => post('/users/check-permission/', { permission }),

    /**
     * Update role permissions.
     * Payload is keyed by role namespace, with inner keys being permission namespaces:
     * { [roleNamespace]: { [permissionNamespace]: boolean } }
     */
    updateRoles: (payload: Record<string, Record<string, boolean>>) => put('/users/roles', payload),

    /** Generate a personal API token. */
    createToken: (name: string) => post('/users/create-token', { name }),

    /** Revoke an API token. */
    deleteToken: (id: number | string) => del(`/users/tokens/${id}`),

    // ── CRUD ────────────────────────────────────────────────────────────────

    /** Create a new user. */
    create: (data: unknown) => post('/crud/sb.users', data),

    /** Update an existing user. */
    update: (id: number | string, data: unknown) => put(`/crud/sb.users/${id}`, data),

    /** Delete a single user. */
    remove: (id: number | string) => del(`/crud/sb.users/${id}`),

    /** Bulk-delete users by ID. */
    bulkDelete: (ids: Array<number | string>) =>
        post('/crud/sb.users/bulk-actions', { action: 'delete_selected', entries: ids }),
};
