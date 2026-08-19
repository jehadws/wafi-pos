import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useState, useEffect } from 'react';
import { ConfirmDialogProvider } from './components/providers/confirm-dialog-provider';
import { initializeTheme } from './hooks/use-appearance';
import { RTLProvider } from './hooks/use-rtl';
import { TranslationProvider } from './lib/i18n';
import { DirectionProvider } from "@/components/ui/direction"
import Settings from './lib/settings';

// API calls go through the shared client in `@/api/http`, which owns the
// base URL, the X-Requested-With header, and the global error interceptor
// (401/419 → login, 403 → access-denied).

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
  setup({ el, App, props }) {
    const root = createRoot(el);
    Settings.set(props.initialPage.props.settings);
    
    const Root = () => {
      const [locale, setLocale] = useState((props.initialPage.props.locale as any) || 'en');

      useEffect(() => {
        const unsubscribe = router.on('success', (event) => {
          const newLocale = event.detail.page.props.locale as string;
          if (newLocale && newLocale !== locale) {
            setLocale(newLocale);
          }
        });
        return () => unsubscribe();
      }, [locale]);

      return (
        <DirectionProvider direction={locale === 'ar' ? 'rtl' : 'ltr'}>
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
