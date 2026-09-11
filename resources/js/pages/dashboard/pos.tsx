import { customersApi } from '@/api';
import ErrorBoundary from '@/components/feedback/error-boundary';
import { OpenRegisterDialog } from '@/components/pos/open-register-dialog';
import PosSystem from '@/components/pos/pos-system';
import { RegisterSessionDialog } from '@/components/pos/register-session-dialog';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { useRegisterSession } from '@/hooks/pos/use-register-session';
import { usePosBeforeUnload } from '@/hooks/use-pos-before-unload';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { resolveDefaultCustomerId } from '@/services/pos-defaults';
import { PaymentType } from '@/types/models/payment-type';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Toaster } from 'sonner';

export default function PosPage() {
  const { t } = useTranslation();
  const { settings, options, license, paymentTypes } = usePage().props as unknown as {
    settings: any;
    options: SbPosOptions;
    license?: { isValid: boolean; isRestricted: boolean; hwid: string };
    paymentTypes: PaymentType[];
  };
  const { defineOptions, defineSettings, initialize, processInitialQueue, setAutoMerge, order, definedPaymentsType } = usePOS();

  usePosBeforeUnload();

  // Cash-register session: gate, idle auto-lock and order register stamping.
  const registerSession = useRegisterSession(options);

  // Sync options & settings into the store whenever they change (e.g. Inertia navigation).
  useEffect(() => {
    defineOptions(options);
    defineSettings(settings);
    if (options[POS_OPTION_KEYS.itemsMerge] !== undefined) {
      setAutoMerge(Boolean(options[POS_OPTION_KEYS.itemsMerge]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, settings]);

  // Load payment types from backend into the store.
  useEffect(() => {
    if (paymentTypes?.length) {
      definedPaymentsType(paymentTypes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentTypes]);

  // Run the initialization queue exactly once on mount.
  useEffect(() => {
    initialize();
    processInitialQueue().catch((err) => {
      console.error('[POS] Initialization queue failed:', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The default ORDER TYPE is applied by the store itself on boot
  // (use-pos-session.ts initialize → applyDefaultOrderType) and re-applied
  // after every cart reset — no page-level effect needed for it.

  // Auto-assign the shop's default (walk-in) customer to new carts when configured.
  // Shops without a default customer keep the explicit select-customer requirement.
  useEffect(() => {
    const defaultCustomerId = resolveDefaultCustomerId(options);
    if (!defaultCustomerId || order.customer) return;

    let cancelled = false;
    customersApi
      .get(defaultCustomerId)
      .then((customer) => {
        if (!cancelled && customer) {
          return usePOS.getState().selectCustomer(customer);
        }
      })
      .catch((error) => {
        console.warn('[POS] Failed to load or assign the default customer:', error);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options[POS_OPTION_KEYS.defaultCustomer]]);

  if (license && (license.isRestricted || !license.isValid)) {
    return (
      <>
        <Head title={t('License Required')} />
        <main className="bg-background flex min-h-screen items-center justify-center p-6">
          <div className="bg-card border-border w-full max-w-md space-y-6 rounded-xl border p-8 text-center shadow-xl">
            <div className="bg-destructive/10 text-destructive mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-foreground text-2xl font-bold">{t('POS Terminal Locked')}</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {t('This POS terminal requires an active, cryptographically signed offline license key to operate.')}
              </p>
            </div>
            <div className="bg-muted/50 space-y-1 rounded-lg p-3 text-start text-xs">
              <span className="text-muted-foreground font-medium">{t('Hardware Fingerprint (HWID):')}</span>
              <p className="text-foreground font-mono font-semibold break-all select-all">{license.hwid}</p>
            </div>
            <a
              href="/activate"
              className="text-primary-foreground bg-primary hover:bg-primary/90 inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold shadow-md transition-all"
            >
              {t('Activate License Key')} &rarr;
            </a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head title={t('Point of Sale')} />
      <main className="bg-background min-h-screen">
        {registerSession.requiresOpenRegister && <OpenRegisterDialog onOpened={() => undefined} />}
        <ErrorBoundary fallbackTitle={t('Point of Sale Error')} onReset={() => usePOS.getState().reset()}>
          <PosSystem />
        </ErrorBoundary>
      </main>
      <RegisterSessionDialog onClosed={() => undefined} />
      <Toaster />
    </>
  );
}
