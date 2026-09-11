import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function CreateCouponPage() {
  const { t } = useTranslation();
  const { title, initialConfig } = usePage<{ title?: string; initialConfig?: CrudFormConfig }>().props;

  return (
    <CrudFormPage
      namespace="sb.coupons"
      initialConfig={initialConfig}
      title={title ?? t('Create a new coupon')}
      description={t('Register a new coupon and save it.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Coupons'), href: '/dashboard/customers/coupons' },
        { title: t('Create Coupon'), href: '/dashboard/customers/coupons/create' },
      ]}
    />
  );
}
