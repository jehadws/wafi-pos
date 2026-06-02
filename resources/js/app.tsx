import axios from 'axios';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ConfirmDialogProvider } from './components/providers/confirm-dialog-provider';
import { initializeTheme } from './hooks/use-appearance';
import { RTLProvider } from './hooks/use-rtl';
import { TranslationProvider } from './lib/i18n';
import { DirectionProvider } from "@/components/ui/direction"
import Settings from './lib/settings';

// Set up axios CSRF protection
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// const csrfToken = document.head.querySelector('meta[name="csrf-token"]');
//
// if (csrfToken) {
//   axios.defaults.headers.common['X-CSRF-TOKEN'] = (csrfToken as HTMLMetaElement).content;
// } else {
//   console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
// }

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
  setup({ el, App, props }) {
    const root = createRoot(el);
    Settings.set(props.initialPage.props.settings);
    const locale = (props.initialPage.props.locale as any) || 'en';
    root.render(
      <DirectionProvider direction={locale === 'ar' ? "rtl" : "ltr"}>
        <RTLProvider locale={locale}>
          <TranslationProvider locale={locale}>
            <ConfirmDialogProvider>
              <App {...props} />
            </ConfirmDialogProvider>
          </TranslationProvider>
        </RTLProvider>
      </DirectionProvider>
      ,
    );
  },
  progress: {
    color: '#4B5563',
  },
});

// This will set light / dark mode on load...
initializeTheme();
