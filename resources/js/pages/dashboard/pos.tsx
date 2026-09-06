import PosSystem from '@/components/pos/pos-system';
import ErrorBoundary from '@/components/feedback/error-boundary';
import { OpenRegisterDialog } from '@/components/pos/open-register-dialog';
import { RegisterSessionDialog } from '@/components/pos/register-session-dialog';
import { customersApi } from '@/api';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import {
  pickDefaultOrderType,
  resolveDefaultCustomerId,
} from '@/services/pos-defaults';
import { usePOS } from '@/hooks/usePOS';
import { usePosBeforeUnload } from '@/hooks/use-pos-before-unload';
import { useRegisterSession } from '@/hooks/pos/use-register-session';
import { useTranslation } from '@/lib/i18n';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { PaymentType } from '@/types/models/payment-type';

/** Static map of identifier → OrderTypeObj shape (mirrors order-type-dialog.tsx) */
const ORDER_TYPE_MAP: Record<string, Omit<OrderTypeObj, 'selected'>> = {
  takeaway: { identifier: 'takeaway', label: 'Take Away', icon: '/images/groceries.png' },
  delivery: { identifier: 'delivery', label: 'Delivery', icon: '/images/delivery.png' },
};

export default function PosPage() {
  const { t } = useTranslation();
  const { settings, options, license, paymentTypes } = usePage().props as unknown as { 
    settings: any; 
    options: SbPosOptions;
    license?: { isValid: boolean; isRestricted: boolean; hwid: string };
    paymentTypes: PaymentType[];
  };
  const { defineOptions, defineSettings, initialize, processInitialQueue, setAutoMerge, setOrderType, order, definedPaymentsType } = usePOS();

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

  // Auto-select order type for new carts:
  // single enabled type → takeaway (when both are active) → first enabled.
  // Deliberately not persisted: every POS page load starts from this
  // deterministic default instead of the terminal's last used type.
  useEffect(() => {
    if (order.type) return;

    const identifier = pickDefaultOrderType(options[POS_OPTION_KEYS.orderTypes]);
    const meta = identifier ? ORDER_TYPE_MAP[identifier] : undefined;
    if (meta) {
      setOrderType({ ...meta, selected: true } as OrderTypeObj);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options[POS_OPTION_KEYS.orderTypes]]);

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
        <main className="bg-background min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-border shadow-xl rounded-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t('POS Terminal Locked')}</h2>
              <p className="text-sm text-muted-foreground mt-2">
                {t('This POS terminal requires an active, cryptographically signed offline license key to operate.')}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-start space-y-1 text-xs">
              <span className="text-muted-foreground font-medium">{t('Hardware Fingerprint (HWID):')}</span>
              <p className="font-mono break-all select-all text-foreground font-semibold">{license.hwid}</p>
            </div>
            <a
              href="/activate"
              className="inline-flex items-center justify-center w-full px-5 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-md"
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
