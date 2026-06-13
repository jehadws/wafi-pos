import PosSystem from '@/components/pos/pos-system';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Toaster } from 'sonner';

/** Static map of identifier → OrderTypeObj shape (mirrors order-type-dialog.tsx) */
const ORDER_TYPE_MAP: Record<string, Omit<OrderTypeObj, 'selected'>> = {
  takeaway: { identifier: 'takeaway', label: 'Take Away', icon: '/images/groceries.png' },
  delivery: { identifier: 'delivery', label: 'Delivery', icon: '/images/delivery.png' },
};

export default function PosPage() {
  const { t } = useTranslation();
  const { settings, options } = usePage().props as { settings: any; options: NsPosOptions };
  const { defineOptions, defineSettings, initialize, processInitialQueue, setAutoMerge, setOrderType, order } = usePOS();

  // Sync options & settings into the store whenever they change (e.g. Inertia navigation).
  useEffect(() => {
    defineOptions(options);
    defineSettings(settings);
    if ((options as any).ns_jgrem_items_merge !== undefined) {
      setAutoMerge((options as any).ns_jgrem_items_merge);
    }
  }, [options, settings]);

  // Run the initialization queue exactly once on mount.
  // initialize() has its own guard inside the Zustand store (the `initialized` flag),
  // so it is safe against React Strict Mode double-invocations and re-renders.
  // This effect intentionally has an empty dependency array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    initialize();
    processInitialQueue().catch((err) => {
      console.error('[POS] Initialization queue failed:', err);
    });
  }, []);

  // Auto-select order type when exactly one type is enabled
  useEffect(() => {
    const enabledTypes = options.ns_jgrem_order_types;
    if (Array.isArray(enabledTypes) && enabledTypes.length === 1 && !order.type) {
      const identifier = enabledTypes[0];
      const meta = ORDER_TYPE_MAP[identifier];
      if (meta) {
        setOrderType({ ...meta, selected: true } as OrderTypeObj);
      }
    }
  }, [options.ns_jgrem_order_types]);

  return (
    <>
      <Head title={t('Point of Sale')}>
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
      </Head>
      <main className="bg-background min-h-screen">
        <PosSystem />
      </main>
      <Toaster />
    </>
  );
}
