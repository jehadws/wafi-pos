import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function CreateTransactionPage() {
  const { t } = useTranslation();
  const { title, infoMessage, initialConfig } = usePage<{
    title?: string;
    infoMessage?: string;
    initialConfig?: CrudFormConfig;
  }>().props;

  return (
    <CrudFormPage
      namespace="sb.transactions"
      initialConfig={initialConfig}
      title={title ?? t('Create New Transaction')}
      description={t('Set direct, scheduled transactions.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Accounting'), href: '/dashboard/accounting' },
        { title: t('Transactions'), href: '/dashboard/accounting/transactions' },
        { title: t('Create New Transaction'), href: '/dashboard/accounting/transactions/create' },
      ]}
      topNotice={infoMessage ? <div className="bg-accent/30 border-primary border-l border-l-3 p-2">{infoMessage}</div> : undefined}
    />
  );
}
