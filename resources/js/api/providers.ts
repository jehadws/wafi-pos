import { post, put } from './http';

/**
 * Providers API — `/api/crud/sb.providers`
 *
 * Row deletes/bulk-deletes are backend-driven (crud table engine); these
 * helpers serve the provider form pages.
 */
export const providersApi = {
  /** Create a new provider. */
  create: (data: unknown) => post('/crud/sb.providers', data),

  /** Update an existing provider. */
  update: (id: number | string, data: unknown) => put(`/crud/sb.providers/${id}`, data),
};
