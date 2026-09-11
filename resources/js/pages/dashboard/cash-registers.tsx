import { useTranslation } from '@/lib/i18n';
import { Head } from '@inertiajs/react';

export default function CashRegisters() {
  const { t } = useTranslation();
  return (
    <>
      <Head title={t('Cash Registers')} />
      <div className="p-6">
        <h1 className="text-2xl font-bold">{t('Cash Registers')}</h1>
      </div>
    </>
  );
}
