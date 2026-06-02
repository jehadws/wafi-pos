import PosSystem from '@/components/pos/pos-system';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Toaster } from 'sonner';

export default function PosPage() {
  const { t } = useTranslation();
  const { settings, options } = usePage().props;
  const { defineOptions } = usePOS();

  useEffect(() => {
    defineOptions(options);
  }, [options]);

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
