type Identification = {
    ns_store_name: string | null
    ns_store_address: string | null
    ns_store_city: string | null
    ns_store_phone: string | null
    ns_store_email: string | null
    ns_store_pobox: string | null
    ns_store_fax: string | null
    ns_store_additional: string | null
    ns_store_square_logo: string | null
    ns_store_rectangle_logo: string | null
    ns_store_language: string | null
    ns_default_theme: string | null
}

type Currency = {
    ns_currency_symbol: string | null
    ns_currency_iso: string | null
    ns_currency_position: string | null
    ns_currency_prefered: string | null
    ns_currency_thousand_separator: string | null
    ns_currency_decimal_separator: string | null
    ns_currency_precision: number | null
}

type DateCfg = {
    ns_date_format: string | null
    ns_datetime_format: string | null
    ns_datetime_timezone: string | null
}

type Registration = {
    ns_registration_enabled: string | null
    ns_registration_role: string | null
    ns_registration_validated: string | null
    ns_recovery_enabled: string | null
}

type AppSettings = {
    identification: Identification
    currency: Currency
    date: DateCfg
    registration: Registration
}

class Settings {
    private static instance: Settings;
    private settings: AppSettings | null = null;

    private constructor() { }

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
            throw new Error("Settings have not been initialized");
        }
        return this.settings;
    }
}

export default Settings.getInstance();