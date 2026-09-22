import { ProcurementProduct } from '@/types/models/procurement';
import { get, post } from './http';

/**
 * Products API — `/api/products/*`
 *
 * Serves the POS search, the product form and the stock-adjustment page.
 * List CRUD (single delete / bulk delete) is backend-driven — the products
 * list renders through `ProductCrud::table()` and the crud engine posts to
 * `/api/crud/sb.products` directly, so no per-page client methods live here.
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

  /** Fetch the procurement batches available for a product. */
  getProcuredProducts: (productId: number | string) => get<ProcurementProduct[]>(`/products/${productId}/procurements`),

  /** Submit a stock adjustment for a set of products. */
  createAdjustment: (products: unknown[]) => post<{ message: string }>('/products/adjustments', { products }),
};
