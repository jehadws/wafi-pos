import { Tax } from '@/types/models/tax';
import { get, post, put } from './http';

/**
 * Taxes API — `/api/taxes/*`, `/api/crud/sb.taxes`, `/api/crud/sb.taxes-groups`
 *
 * Row deletes/bulk-deletes are backend-driven (crud table engine); these
 * helpers serve the POS (tax-group reads) and the tax / tax-group form
 * pages.
 */
export const taxesApi = {
  /** Fetch all tax groups. */
  getGroups: () => get('/taxes/groups'),

  /** Fetch a tax group (with its taxes) by id. */
  getGroup: (id: number | string) => get<Tax>(`/taxes/groups/${id}`),

  // ── CRUD — sb.taxes ─────────────────────────────────────────────────────

  /** Create a new tax. */
  create: (data: unknown) => post('/crud/sb.taxes', data),

  /** Update an existing tax. */
  update: (id: number | string, data: unknown) => put(`/crud/sb.taxes/${id}`, data),

  // ── CRUD — sb.taxes-groups ──────────────────────────────────────────────

  /** Create a new tax group. */
  createGroup: (data: unknown) => post('/crud/sb.taxes-groups', data),

  /** Update an existing tax group. */
  updateGroup: (id: number | string, data: unknown) => put(`/crud/sb.taxes-groups/${id}`, data),
};
