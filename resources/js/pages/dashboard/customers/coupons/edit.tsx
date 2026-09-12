import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function EditCouponPage() {
  const { t } = useTranslation();
  const { coupon, title, initialConfig } = usePage<{
    coupon: { id: number | string };
    title?: string;
    initialConfig?: CrudFormConfig;
  }>().props;

  return (
    <CrudFormPage
      namespace="sb.coupons"
      id={coupon.id}
      initialConfig={initialConfig}
      title={title ?? t('Edit Coupon')}
      description={t('Modify coupon details.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Coupons'), href: '/dashboard/customers/coupons' },
        { title: t('Edit Coupon'), href: `/dashboard/customers/coupons/${coupon.id}/edit` },
      ]}
    />
  );
}
