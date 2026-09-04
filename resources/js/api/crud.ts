import { del, get } from './http';

/**
 * Generic CRUD API — `/api/crud/{table}`
 *
 * The backend exposes a generic CRUD endpoint for many resources
 * (sb.orders, sb.transactions-accounts, ...). Pagination goes through
 * `page` / `per_page` params; any extra filters are passed as-is.
 *
 * Responses are Laravel paginators — pass an explicit type parameter
 * (e.g. `HttpCrudResponse`) where a typed result is useful.
 */
export const crudApi = {
    /** List entries of a CRUD table with pagination and filters. */
    list: <T = any>(table: string, params?: Record<string, unknown>) =>
        get<T>(`/crud/${table}`, { params: { ...params } }),

    /** Delete a single entry of a CRUD table. */
    remove: (table: string, id: number | string) => del(`/crud/${table}/${id}`),
};
