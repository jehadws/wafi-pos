import '../css/app.css';

import { DirectionProvider } from '@/components/ui/direction';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfirmDialogProvider } from './components/providers/confirm-dialog-provider';
import { initializeTheme } from './hooks/use-appearance';
import { RTLProvider } from './hooks/use-rtl';
import { TranslationProvider } from './lib/i18n';
import { isRTLLocale } from './lib/i18n/direction';
import type { AppSettings } from './lib/settings';
import Settings from './lib/settings';

// API calls go through the shared client in `@/api/http`, which owns the
// base URL, the X-Requested-With header, and the global error interceptor
// (401/419 → login, 403 → access-denied).

const appName = import.meta.env.VITE_APP_NAME || 'Subul';

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
  setup({ el, App, props }) {
    const root = createRoot(el);
    Settings.set(props.initialPage.props.settings as AppSettings);
    const Root = () => {
      const [locale, setLocale] = useState((props.initialPage.props.locale as any) || 'en');

      useEffect(() => {
        const unsubscribe = router.on('success', (event) => {
          const newLocale = event.detail.page.props.locale as string;
          if (newLocale && newLocale !== locale) {
            setLocale(newLocale);
          }
          // Re-sync the Settings singleton so formatting (currency, dates)
          // reflects any changes made on the previous page.
          const freshSettings = event.detail.page.props.settings as AppSettings | undefined;
          if (freshSettings) {
            Settings.set(freshSettings);
          }
        });
        return () => unsubscribe();
      }, [locale]);

      return (
        <DirectionProvider dir={isRTLLocale(locale) ? 'rtl' : 'ltr'}>
          <RTLProvider locale={locale}>
            <TranslationProvider locale={locale}>
              <ConfirmDialogProvider>
                <App {...props} />
              </ConfirmDialogProvider>
            </TranslationProvider>
          </RTLProvider>
        </DirectionProvider>
      );
    };

    root.render(<Root />);
  },
  progress: {
    color: '#4B5563',
  },
});

// This will set light / dark mode on load...
initializeTheme();
