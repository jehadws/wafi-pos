import { get, put } from './http';

/**
 * Units API — `/api/units`, `/api/crud/sb.units-groups`
 *
 * `sb.units` row deletes/bulk-deletes are backend-driven (crud table
 * engine); these helpers serve the POS quick-product popup (getAll) and
 * the unit-group form (updateGroup).
 */
export const unitsApi = {
  /** Fetch all units. */
  getAll: () => get('/units'),

  /** Update an existing unit group. */
  updateGroup: (id: number | string, data: unknown) => put(`/crud/sb.units-groups/${id}`, data),
};
