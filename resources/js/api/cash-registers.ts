import { get, post, put } from './http';

/**
 * Cash Registers API — `/api/cash-registers/*`
 *
 * Mirrors `routes/api/registers.php` and
 * `App\Http\Controllers\Dashboard\CashRegistersController`.
 */
export interface ApiRegister {
  id: number;
  name: string;
  status: 'closed' | 'opened' | 'disabled' | 'in_use' | string;
  balance: number;
  used_by?: number | null;
  status_label?: string;
  opening_balance?: number;
  total_sale_amount?: number;
}

export interface ApiRegisterHistory {
  id: number;
  action: string;
  value: number;
  balance_before: number | null;
  balance_after: number | null;
  description?: string | null;
  label?: string;
  payment_label?: string | null;
  created_at: string;
  order?: { code: string } | null;
}

export interface SessionSummaryEntry {
  label: string;
  value: number;
  color: string;
}

/** GET /api/cash-registers — all registers with computed details. */
export function getRegisters() {
  return get<ApiRegister[]>('/cash-registers');
}

/** GET /api/cash-registers/used — the register opened by the logged user. 403 when none. */
export function getUsedRegister() {
  // The backend wraps the register inside `data.register`.
  return get<{ status: string; message: string; data: { register: ApiRegister } }>('/cash-registers/used');
}

/** POST /api/cash-registers/{action}/{register} — open/close/cash-in/cash-out. */
export function performRegisterAction(
  action: 'open' | 'close' | 'register-cash-in' | 'register-cash-out',
  registerId: number,
  payload: { amount: number; description?: string },
) {
  return post(`/cash-registers/${action}/${registerId}`, payload);
}

/** GET /api/cash-registers/session-history/{register} — current session history + summary. */
export function getSessionHistory(registerId: number) {
  return get<{
    history: ApiRegisterHistory[];
    summary: SessionSummaryEntry[];
  }>(`/cash-registers/session-history/${registerId}`);
}

export const cashRegistersApi = {
  getRegisters,
  getUsedRegister,
  performRegisterAction,
  getSessionHistory,

  // ── CRUD — sb.cash-registers ────────────────────────────────────────────

  /** Create a new cash register. */
  create: (data: unknown) => post('/crud/sb.cash-registers', data),

  /** Update an existing cash register. */
  update: (id: number | string, data: unknown) => put(`/crud/sb.cash-registers/${id}`, data),

  /** Bulk-delete cash registers by ID. */
  bulkDelete: (ids: Array<number | string>) => post('/crud/sb.cash-registers/bulk-actions', { action: 'delete_selected', entries: ids }),
};
