import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function EditPaymentTypePage() {
  const { t } = useTranslation();
  const { paymentType, title, initialConfig } = usePage<{
    paymentType: PaymentType;
    title?: string;
    initialConfig?: CrudFormConfig;
  }>().props;

  return (
    <CrudFormPage
      namespace="sb.payments-types"
      id={paymentType.id}
      initialConfig={initialConfig}
      title={title ?? t('Edit payment type')}
      description={t('Modify  Payment Type.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Payment Types'), href: '/dashboard/orders/payments-types' },
        { title: t('Edit payment type'), href: `/dashboard/orders/payments-types/edit/${paymentType.id}` },
      ]}
    />
  );
}
