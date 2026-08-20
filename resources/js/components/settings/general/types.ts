export type Identification = {
    ns_store_name: string | null;
    ns_store_address: string | null;
    ns_store_city: string | null;
    ns_store_phone: string | null;
    ns_store_email: string | null;
    ns_store_pobox: string | null;
    ns_store_fax: string | null;
    ns_store_additional: string | null;
    ns_store_square_logo: string | null;
    ns_store_rectangle_logo: string | null;
    ns_store_language: string | null;
    ns_default_theme: string | null;
};

export type Currency = {
    ns_currency_symbol: string | null;
    ns_currency_iso: string | null;
    ns_currency_position: string | null;
    ns_currency_prefered: string | null;
    ns_currency_thousand_separator: string | null;
    ns_currency_decimal_separator: string | null;
    ns_currency_precision: number | null;
};

export type DateCfg = {
    ns_date_format: string | null;
    ns_datetime_format: string | null;
    ns_datetime_timezone: string | null;
};

export type Registration = {
    ns_registration_enabled: string | null;
    ns_registration_role: string | null;
    ns_registration_validated: string | null;
    ns_recovery_enabled: string | null;
};

export type GeneralSettingsPayload = {
    identification: Identification;
    currency: Currency;
    date: DateCfg;
    registration: Registration;
};

export type GeneralOption = {
    label: string;
    value: string | number;
};

export type GeneralSettingsOptions = {
    ns_currency_position: GeneralOption[];
    ns_currency_precision: GeneralOption[];
    ns_currency_prefered: GeneralOption[];
    ns_date_format: GeneralOption[];
    ns_datetime_format: GeneralOption[];
    ns_datetime_timezone: GeneralOption[];
    ns_default_theme: GeneralOption[];
    ns_registration_enabled: GeneralOption[];
    ns_registration_role: GeneralOption[];
    ns_registration_validated: GeneralOption[];
    ns_store_language: GeneralOption[];
};
