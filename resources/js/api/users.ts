import { del, get, post, put } from './http';

/**
 * Users API — `/api/users/*`
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
};
