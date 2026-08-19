import { get } from './http';

/**
 * Categories API — `/api/categories/*`
 */
export const categoriesApi = {
    /** Fetch all categories. */
    getAll: () => get('/categories'),

    /**
     * Fetch POS category panel content: child categories, products and the
     * current category breadcrumb. Pass no id for the root level.
     */
    getPosContent: (parentId?: number | string) => get(`/categories/pos/${parentId ?? ''}`),
};
