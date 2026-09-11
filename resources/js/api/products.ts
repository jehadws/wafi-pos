import { del, get, post } from './http';

/**
 * Products API — `/api/products/*`, `/api/crud/sb.products`
 */
export const productsApi = {
  /** Fetch all products. */
  getAll: () => get('/products'),

  /** Search products by name / SKU / barcode. Respects the POS visibility
   *  settings ("Hide Exhausted Products", on-sale only) unless
   *  `respectPosSettings` is false. */
  search: (query: string, respectPosSettings = true) => post('/products/search', { search: query, pos: respectPosSettings }),

  /** Look up a single product by its barcode (POS scanner). */
  searchByBarcode: (barcode: string) => get<ProductSearchBarcode>(`/products/search/using-barcode/${barcode}`),

  /** Fetch the unit quantities available for a product. */
  getUnitQuantities: (productId: number | string) => get<UnitQuantity[]>(`/products/${productId}/units/quantities`),

  /** Submit a stock adjustment for a set of products. */
  createAdjustment: (products: unknown[]) => post<{ message: string }>('/products/adjustments', { products }),

  /** Create a new product. */
  create: (data: unknown) => post('/products', data),

  // ── CRUD — sb.products ──────────────────────────────────────────────────

  /** Delete a single product. */
  remove: (id: number | string) => del(`/crud/sb.products/${id}`),

  /** Bulk-delete products by ID. */
  bulkDelete: (ids: Array<number | string>) => post('/crud/sb.products/bulk-actions', { action: 'delete_selected', entries: ids }),
};
