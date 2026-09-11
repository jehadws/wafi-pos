import { Tax } from '@/types/models/tax';
import { del, get, post, put } from './http';

/**
 * Taxes API — `/api/taxes/*`, `/api/crud/sb.taxes`, `/api/crud/sb.taxes-groups`
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

  /** Delete a single tax. */
  remove: (id: number | string) => del(`/crud/sb.taxes/${id}`),

  /** Bulk-delete taxes by ID. */
  bulkDelete: (ids: Array<number | string>) => post('/crud/sb.taxes/bulk-actions', { action: 'delete_selected', entries: ids }),

  // ── CRUD — sb.taxes-groups ──────────────────────────────────────────────

  /** Create a new tax group. */
  createGroup: (data: unknown) => post('/crud/sb.taxes-groups', data),

  /** Update an existing tax group. */
  updateGroup: (id: number | string, data: unknown) => put(`/crud/sb.taxes-groups/${id}`, data),

  /** Delete a single tax group. */
  removeGroup: (id: number | string) => del(`/crud/sb.taxes-groups/${id}`),

  /** Bulk-delete tax groups by ID. */
  bulkDeleteGroups: (ids: Array<number | string>) => post('/crud/sb.taxes-groups/bulk-actions', { action: 'delete_selected', entries: ids }),
};
