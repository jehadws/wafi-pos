import { get, post, put } from './http';

/**
 * Procurements API — `/api/procurements/*`, `/api/crud/sb.procurements-products`
 *
 * `sb.procurements` row deletes/bulk-deletes and the Set-Paid / Refresh
 * GET actions are backend-driven (crud table engine); these helpers serve
 * the procurement form, the stock-adjustment page and the
 * procurement-product edit form.
 */
export const procurementsApi = {
  /** Search products while building a procurement. */
  searchProduct: (search: string) => post('/procurements/products/search-product', { search }),

  /** Search products and procurements for stock adjustment. */
  searchProcurementProduct: (argument: string) => post('/procurements/products/search-procurement-product', { argument }),

  /** Fetch the units belonging to a unit group. */
  getUnitGroupUnits: (groupId: number | string) => get(`/units-groups/${groupId}/units`),

  // ── CRUD — sb.procurements-products ────────────────────────────────────

  /** Update a procurement product. */
  updateProduct: (id: number | string, data: unknown) => put(`/crud/sb.procurements-products/${id}`, data),
};
