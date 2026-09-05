import { get, post } from './http';

/** Settings sections exposed by the backend `/api/settings/*` endpoints. */
export type SettingsSection = 'accounting' | 'customers' | 'general' | 'orders' | 'pos' | 'reports' | 'workers';

/**
 * Settings API — `/api/settings/*`
 */
export const settingsApi = {
    /** Persist a settings section. */
    update: (section: SettingsSection, data: unknown) => post(`/settings/${section}`, data),

    /** Fetch the current GeneralSettings payload (for re-syncing the frontend singleton). */
    getCurrent: () => get('/settings/current'),
};
