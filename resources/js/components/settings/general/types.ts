export type Identification = {
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

export type Currency = {
  sb_currency_symbol: string | null;
  sb_currency_iso: string | null;
  sb_currency_position: string | null;
  sb_currency_prefered: string | null;
  sb_currency_thousand_separator: string | null;
  sb_currency_decimal_separator: string | null;
  sb_currency_precision: number | null;
};

export type DateCfg = {
  sb_date_format: string | null;
  sb_datetime_format: string | null;
  sb_datetime_timezone: string | null;
};

export type Registration = {
  sb_registration_enabled: string | null;
  sb_registration_role: string | null;
  sb_registration_validated: string | null;
  sb_recovery_enabled: string | null;
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
  sb_currency_position: GeneralOption[];
  sb_currency_precision: GeneralOption[];
  sb_currency_prefered: GeneralOption[];
  sb_date_format: GeneralOption[];
  sb_datetime_format: GeneralOption[];
  sb_datetime_timezone: GeneralOption[];
  sb_default_theme: GeneralOption[];
  sb_registration_enabled: GeneralOption[];
  sb_registration_role: GeneralOption[];
  sb_registration_validated: GeneralOption[];
  sb_store_language: GeneralOption[];
};
