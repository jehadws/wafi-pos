import type { CrudFormConfig, CrudSubmitResponse } from '@/types/forms';
import type { CrudTableConfig } from '@/types/tables';
import { del, get, post, put } from './http';

/**
 * Generic CRUD API — `/api/crud/{table}`
 *
 * The backend exposes a generic CRUD endpoint for many resources
 * (sb.orders, sb.transactions-accounts, ...). Pagination goes through
 * `page` / `per_page` params; any extra filters are passed as-is.
 *
 * Responses are Laravel paginators — pass an explicit type parameter
 * (e.g. `HttpCrudResponse`) where a typed result is useful.
 */
export const crudApi = {
  /** List entries of a CRUD table with pagination and filters. */
  list: <T = any>(table: string, params?: Record<string, unknown>) => get<T>(`/crud/${table}`, { params: { ...params } }),

  /** Delete a single entry of a CRUD table. */
  remove: (table: string, id: number | string) => del(`/crud/${table}/${id}`),

  /**
   * Fetch the backend form definition of a CRUD resource
   * (`CrudService::getFormConfig`). `id` switches the definition
   * (and the submit method) to edit mode.
   */
  formConfig: <T = CrudFormConfig>(table: string, id?: number | string) => get<T>(`/crud/${table}/form-config${id !== undefined ? `/${id}` : ''}`),

  /**
   * Fetch the backend table definition of a CRUD resource
   * (`CrudService::getTableConfig`), the tables counterpart of
   * `formConfig()`.
   */
  tableConfig: <T = CrudTableConfig>(table: string) => get<T>(`/crud/${table}/config`),

  /**
   * Create an entry. The payload must follow `SbForms::getFlatForm`:
   * `{ [mainFieldName]: value, [tabId]: { [fieldName]: value }, ... }` —
   * the backend drops `''`/`null` values.
   */
  create: <T = CrudSubmitResponse>(table: string, payload: Record<string, unknown>) => post<T>(`/crud/${table}`, payload),

  /** Update an entry with the same payload contract as `create`. */
  update: <T = CrudSubmitResponse>(table: string, id: number | string, payload: Record<string, unknown>) => put<T>(`/crud/${table}/${id}`, payload),
};
