import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

interface Transaction {
  id: number;
  name: string;
}

export default function EditTransactionPage() {
  const { t } = useTranslation();
  const { transaction, title, infoMessage, initialConfig } = usePage<{
    transaction: Transaction;
    title?: string;
    infoMessage?: string;
    initialConfig?: CrudFormConfig;
  }>().props;

  return (
    <CrudFormPage
      namespace="sb.transactions"
      id={transaction.id}
      initialConfig={initialConfig}
      title={title ?? t('Edit Transaction')}
      description={t('Set direct, scheduled transactions.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Accounting'), href: '/dashboard/accounting' },
        { title: t('Transactions'), href: '/dashboard/accounting/transactions' },
        { title: t('Edit Transaction'), href: '#' },
      ]}
      topNotice={infoMessage ? <div className="bg-accent/30 border-primary border-l border-l-3 p-2">{infoMessage}</div> : undefined}
    />
  );
}
