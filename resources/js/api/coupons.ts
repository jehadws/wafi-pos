import { post, put } from './http';

/**
 * Coupons API — `/api/crud/sb.coupons`
 *
 * Row deletes/bulk-deletes are backend-driven (crud table engine); these
 * helpers serve the coupon form pages.
 */
export const couponsApi = {
  /** Create a new coupon. */
  create: (data: unknown) => post('/crud/sb.coupons', data),

  /** Update an existing coupon. */
  update: (id: number | string, data: unknown) => put(`/crud/sb.coupons/${id}`, data),
};
