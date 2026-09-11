import { del, post, put } from './http';

/**
 * Providers API — `/api/crud/sb.providers`
 */
export const providersApi = {
  /** Create a new provider. */
  create: (data: unknown) => post('/crud/sb.providers', data),

  /** Update an existing provider. */
  update: (id: number | string, data: unknown) => put(`/crud/sb.providers/${id}`, data),

  /** Delete a single provider. */
  remove: (id: number | string) => del(`/crud/sb.providers/${id}`),

  /** Bulk-delete providers by ID. */
  bulkDelete: (ids: Array<number | string>) => post('/crud/sb.providers/bulk-actions', { action: 'delete_selected', entries: ids }),
};
