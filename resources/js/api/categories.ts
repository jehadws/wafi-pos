import { del, get, post, put } from './http';

/**
 * Categories API — `/api/categories/*`, `/api/crud/sb.products-categories`
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

    /** Delete a single product category. */
    remove: (id: number | string) => del(`/crud/sb.products-categories/${id}`),

    /** Bulk-delete product categories by ID. */
    bulkDelete: (ids: Array<number | string>) =>
        post('/crud/sb.products-categories/bulk-actions', { action: 'delete_selected', entries: ids }),
};
