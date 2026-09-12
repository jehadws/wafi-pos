import { get, post } from './http';

/** Settings sections exposed by the backend `/api/settings/*` endpoints. */
export type SettingsSection = 'accounting' | 'customers' | 'general' | 'invoices' | 'orders' | 'pos' | 'reports' | 'reset' | 'workers';

/**
 * Settings API — `/api/settings/*`
 */
export const settingsApi = {
  /** Persist a settings section. */
  update: (section: SettingsSection | (string & {}), data: unknown) => post(`/settings/${section}`, data),

  /** Fetch form configuration for a settings section. */
  getForm: <T = unknown>(identifier: string) => get<T>(`/settings/${identifier}`),

  /** Fetch the current GeneralSettings payload (for re-syncing the frontend singleton). */
  getCurrent: () => get('/settings/current'),
};
