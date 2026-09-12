import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function CreateRewardSystemPage() {
  const { t } = useTranslation();
  const { title, initialConfig } = usePage<{ title?: string; initialConfig?: CrudFormConfig }>().props;

  return (
    <CrudFormPage
      namespace="sb.rewards-system"
      initialConfig={initialConfig}
      title={title ?? t('Create a new reward system')}
      description={t('Register a new reward system and save it.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Coupons'), href: '/dashboard/customers/coupons' },
        { title: t('Create a new reward system'), href: '/dashboard/customers/rewards-system/create' },
      ]}
    />
  );
}
