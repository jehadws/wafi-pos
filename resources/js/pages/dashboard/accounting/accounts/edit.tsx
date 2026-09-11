import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

interface TransactionAccount {
  id: number;
  name: string;
}

export default function EditTransactionAccountPage() {
  const { t } = useTranslation();
  const { transaction_account, title, initialConfig } = usePage<{
    transaction_account: TransactionAccount;
    title?: string;
    initialConfig?: CrudFormConfig;
  }>().props;

  return (
    <CrudFormPage
      namespace="sb.transactions-accounts"
      id={transaction_account.id}
      initialConfig={initialConfig}
      title={title ?? `${t('Edit Account')} — ${transaction_account.name}`}
      description={t('Register a new Account and save it.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Accounting'), href: '/dashboard/accounting' },
        { title: t('Accounts'), href: '/dashboard/accounting/accounts' },
        { title: t('Edit Account'), href: `/dashboard/accounting/accounts/edit/${transaction_account.id}` },
      ]}
    />
  );
}
