import type { TranslationParams, Translations } from './types';

class I18n {
    private translations: Translations = {};
    private currentLocale: string = 'en';
    private fallbackLocale: string = 'en';

    constructor() {
        if (typeof window !== 'undefined') {
            const storedLocale = localStorage.getItem('locale');
            if (storedLocale) {
                this.currentLocale = storedLocale;
            }
        }
    }

    setTranslations(locale: string, translations: Translations) {
        this.translations[locale] = translations;
    }

    setLocale(locale: string) {
        this.currentLocale = locale;
        if (typeof window !== 'undefined') {
            localStorage.setItem('locale', locale);
        }
    }

    getLocale(): string {
        return this.currentLocale;
    }

    private getTranslation(key: string, locale: string): string | null {
        const keys = key.split('.');
        let current: any = this.translations[locale] || {};

        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                return null;
            }
        }

        return typeof current === 'string' ? current : null;
    }

    translate(key: string, params?: TranslationParams): string {
        let translation = this.getTranslation(key, this.currentLocale);

        if (!translation && this.currentLocale !== this.fallbackLocale) {
            translation = this.getTranslation(key, this.fallbackLocale);
        }

        if (!translation) {
            return key;
        }

        if (params) {
            return this.interpolate(translation, params);
        }

        return translation;
    }

    private interpolate(template: string, params: TranslationParams): string {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? String(params[key]) : match;
        });
    }

    async loadTranslations(locale: string): Promise<void> {
        if (this.translations[locale]) {
            return;
        }

        try {
            const translations = await import(`../../../../lang/${locale}.json`);
            this.setTranslations(locale, translations.default);
        } catch (error) {
            console.error(`Failed to load translations for locale: ${locale}`, error);
        }
    }
}

export const i18n = new I18n();
