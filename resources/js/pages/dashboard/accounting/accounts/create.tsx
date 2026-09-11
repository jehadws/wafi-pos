import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function CreateTransactionAccountPage() {
  const { t } = useTranslation();
  const { title, initialConfig } = usePage<{ title?: string; initialConfig?: CrudFormConfig }>().props;

  return (
    <CrudFormPage
      namespace="sb.transactions-accounts"
      initialConfig={initialConfig}
      title={title ?? t('Create a new Account')}
      description={t('Register a new Account and save it.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Accounting'), href: '/dashboard/accounting' },
        { title: t('Accounts'), href: '/dashboard/accounting/accounts' },
        { title: t('Create Account'), href: '/dashboard/accounting/accounts/create' },
      ]}
    />
  );
}
