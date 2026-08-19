import { del, get, post } from './http';

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

    /** Generate a personal API token. */
    createToken: (name: string) => post('/users/create-token', { name }),

    /** Revoke an API token. */
    deleteToken: (id: number | string) => del(`/users/tokens/${id}`),
};
