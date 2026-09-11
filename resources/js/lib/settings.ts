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
      throw new Error('Settings have not been initialized');
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
