import { AxiosRequestConfig } from 'axios';
import { del, get, post, put } from './http';

/**
 * Orders API — `/api/orders/*`
 *
 * Return types use the ambient global declarations (types/module.d.ts,
 * types/payment.d.ts) that consumers already rely on.
 */
export const ordersApi = {
  /** Fetch a single order (supports AbortController signal). */
  get: (orderId: number | string, config?: AxiosRequestConfig) => get<Order>(`/orders/${orderId}`, config),

  /**
   * Fetch an order shaped for the POS screen.
   *
   * Intentionally returns `any` for now: `usePOS.loadOrder` merges the
   * result with `defaultOrder()` and relies on loose property access.
   * TODO: type this properly when usePOS is split into focused stores.
   */
  getForPos: (orderId: number | string) => get(`/orders/${orderId}/pos`),

  /** Fetch the products attached to an order. */
  getProducts: (orderId: number | string) => get<TOrderProducts[]>(`/orders/${orderId}/products`),

  /** Fetch the payment options available for orders. */
  getPayments: () => get('/orders/payments'),

  /** Refund an order. */
  refund: (orderId: number | string, payload: Record<string, unknown>) => post(`/orders/${orderId}/refund`, payload),

  /** Void an order. */
  void: (orderId: number | string, payload: { reason: string }) => post(`/orders/${orderId}/void`, payload),

  /**
   * Submit (create or update) an order from the POS.
   * Uses PUT when the order already has an id, POST otherwise.
   */
  submit: (order: { id?: number | string } & Record<string, unknown>) =>
    order.id !== undefined ? put(`/orders/${order.id}`, order) : post('/orders', order),

  /** Instalment sub-API — maps 1-to-1 with `/api/orders/{order}/instalments/*` */
  instalments: {
    /** Fetch all instalments for an order. */
    list: (orderId: number | string) => get<OrderInstalment[]>(`/orders/${orderId}/instalments`),

    /** Create a new instalment. */
    create: (orderId: number | string, payload: { amount: number; date: string }) => post(`/orders/${orderId}/instalments`, { instalment: payload }),

    /** Update an existing instalment (date / amount). */
    update: (orderId: number | string, instalmentId: number | string, payload: { amount: number; date: string }) =>
      put(`/orders/${orderId}/instalments/${instalmentId}`, { instalment: payload }),

    /** Delete an instalment. */
    delete: (orderId: number | string, instalmentId: number | string) => del(`/orders/${orderId}/instalments/${instalmentId}`),

    /** Mark an instalment as paid, optionally with a payment type identifier. */
    pay: (orderId: number | string, instalmentId: number | string, payment_type?: string) =>
      post(`/orders/${orderId}/instalments/${instalmentId}/pay`, { payment_type }),
  },

  // ── CRUD — sb.orders ────────────────────────────────────────────────────

  /** Bulk-delete orders by ID. */
  bulkDelete: (ids: Array<number | string>) => post('/crud/sb.orders/bulk-actions', { action: 'delete_selected', entries: ids }),
};
