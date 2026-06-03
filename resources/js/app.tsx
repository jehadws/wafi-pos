import axios from 'axios';
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

// Set up axios CSRF protection
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Global interceptor — handle session and permission errors from any axios API call
// axios.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const status = error?.response?.status;
//
//     if (status === 401 || status === 419) {
//       // Session expired or CSRF token expired → send to login
//       window.location.href = '/login';
//     } else if (status === 403) {
//       // Authenticated but no permission → send to access-denied page
//       // Pass current URL as `back` so the "Go Back" button works
//       const back = encodeURIComponent(window.location.href);
//       window.location.href = `/errors/access-denied?back=${back}`;
//     }
//
//     return Promise.reject(error);
//   }
// );

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
