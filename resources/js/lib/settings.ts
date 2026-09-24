import { settingsApi } from '@/api/settings';

type Identification = {
  sb_store_name: string | null;
  sb_store_address: string | null;
  sb_store_city: string | null;
  sb_store_phone: string | null;
  sb_store_email: string | null;
  sb_store_pobox: string | null;
  sb_store_fax: string | null;
  sb_store_additional: string | null;
  sb_store_square_logo: string | null;
  sb_store_rectangle_logo: string | null;
  sb_store_language: string | null;
  sb_default_theme: string | null;
};

type Currency = {
  sb_currency_symbol: string | null;
  sb_currency_iso: string | null;
  sb_currency_position: string | null;
  sb_currency_prefered: string | null;
  sb_currency_thousand_separator: string | null;
  sb_currency_decimal_separator: string | null;
  sb_currency_precision: number | null;
};

type DateCfg = {
  sb_date_format: string | null;
  sb_datetime_format: string | null;
  sb_datetime_timezone: string | null;
};

type Registration = {
  sb_registration_enabled: string | null;
  sb_registration_role: string | null;
  sb_registration_validated: string | null;
  sb_recovery_enabled: string | null;
};

/**
 * Safe defaults returned before the first share payload arrives (e.g. during
 * setup). Deliberate fallback, not an error: a missing-settings crash would be
 * a full white screen, whereas defaults degrade gracefully (wrong currency
 * symbol at worst) until `sync()` hydrates real values.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  identification: {
    sb_store_name: null,
    sb_store_address: null,
    sb_store_city: null,
    sb_store_phone: null,
    sb_store_email: null,
    sb_store_pobox: null,
    sb_store_fax: null,
    sb_store_additional: null,
    sb_store_square_logo: null,
    sb_store_rectangle_logo: null,
    sb_store_language: null,
    sb_default_theme: null,
  },
  currency: {
    sb_currency_symbol: '$',
    sb_currency_iso: null,
    sb_currency_position: 'before',
    sb_currency_prefered: null,
    sb_currency_thousand_separator: ',',
    sb_currency_decimal_separator: '.',
    sb_currency_precision: 2,
  },
  date: {
    sb_date_format: null,
    sb_datetime_format: null,
    sb_datetime_timezone: null,
  },
  registration: {
    sb_registration_enabled: null,
    sb_registration_role: null,
    sb_registration_validated: null,
    sb_recovery_enabled: null,
  },
};

export type AppSettings = {
  identification: Identification;
  currency: Currency;
  date: DateCfg;
  registration: Registration;
};

class Settings {
  private static instance: Settings;
  private settings: AppSettings | null = null;

  private constructor() {}

  public static getInstance(): Settings {
    if (!Settings.instance) {
      Settings.instance = new Settings();
    }
    return Settings.instance;
  }

  public set(settings: AppSettings) {
    this.settings = settings;
  }

  public get() {
    if (!this.settings) {
      // During setup (or before the first share payload arrives) settings may
      // be empty. Returning safe defaults instead of throwing prevents a full
      // white screen if a component reads settings too early.
      return DEFAULT_SETTINGS;
    }
    return this.settings;
  }

  /**
   * Re-fetch the latest settings from the backend and update the singleton.
   * Call this after saving general settings or on Inertia navigations.
   */
  public async sync(): Promise<void> {
    try {
      const fresh = await settingsApi.getCurrent();
      if (fresh && typeof fresh === 'object') {
        this.settings = fresh as AppSettings;
      }
    } catch {
      // Silently ignore — stale settings are better than a crash
    }
  }
}

export default Settings.getInstance();
