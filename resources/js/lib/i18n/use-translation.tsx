import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { i18n } from './i18n';
import type { TranslationContextType, TranslationParams } from './types';

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children, locale }: { children: ReactNode; locale: string }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeTranslations = async () => {
      setIsLoading(true);
      try {
        await i18n.loadTranslations(String(locale));
        i18n.setLocale(String(locale));
      } catch (error) {
        console.error('Failed to initialize translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTranslations();
  }, [locale]);

  const t = (key: string, params?: TranslationParams) => {
    return i18n.translate(key, params);
  };

  const changeLocale = async (newLocale: string) => {
    setIsLoading(true);
    try {
      await i18n.loadTranslations(String(newLocale));
      i18n.setLocale(String(newLocale));
      window.location.reload();
    } catch (error) {
      console.error('Failed to change locale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return <TranslationContext.Provider value={{ t, locale: String(locale), changeLocale, isLoading }}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
