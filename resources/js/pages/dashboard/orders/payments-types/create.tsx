import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function CreatePaymentTypePage() {
  const { t } = useTranslation();
  const { title, initialConfig } = usePage<{ title?: string; initialConfig?: CrudFormConfig }>().props;

  return (
    <CrudFormPage
      namespace="sb.payments-types"
      initialConfig={initialConfig}
      title={title ?? t('Create a new payment type')}
      description={t('Register a new payment type and save it.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Payment Types'), href: '/dashboard/orders/payments-types' },
        { title: t('Create a new payment type'), href: '/dashboard/orders/payments-types/create' },
      ]}
    />
  );
}
