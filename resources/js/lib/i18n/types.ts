export type TranslationKey = string;
export type TranslationParams = Record<string, string | number>;

export interface Translations {
  [key: string]: string | Translations;
}

export interface TranslationContextType {
  t: (key: TranslationKey, params?: TranslationParams) => string;
  locale: string;
  changeLocale: (locale: string) => Promise<void>;
  isLoading: boolean;
}

export interface I18nConfig {
  fallbackLocale: string;
  defaultLocale: string;
  availableLocales: string[];
}
