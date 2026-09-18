import { get, post, put } from './http';

/**
 * Categories API — `/api/categories/*`, `/api/crud/sb.products-categories`
 *
 * Row deletes/bulk-deletes are backend-driven (crud table engine); these
 * helpers serve the reports (getAll), the POS category panel
 * (getPosContent) and the category form pages.
 */
export const categoriesApi = {
  /** Fetch all categories. */
  getAll: () => get('/categories'),

  /**
   * Fetch POS category panel content: child categories, products and the
   * current category breadcrumb. Pass no id for the root level.
   */
  getPosContent: (parentId?: number | string) => get(`/categories/pos/${parentId ?? ''}`),

  // ── CRUD ────────────────────────────────────────────────────────────────

  /** Create a new product category. */
  create: (data: unknown) => post('/crud/sb.products-categories', data),

  /** Update an existing product category. */
  update: (id: number | string, data: unknown) => put(`/crud/sb.products-categories/${id}`, data),
};
