import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function EditRewardSystemPage() {
  const { t } = useTranslation();
  const { reward, title, initialConfig } = usePage<{
    reward: { id: number | string };
    title?: string;
    initialConfig?: CrudFormConfig;
  }>().props;

  return (
    <CrudFormPage
      namespace="sb.rewards-system"
      id={reward.id}
      initialConfig={initialConfig}
      title={title ?? t('Edit reward system')}
      description={t('Modify  Reward System.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Reward Systems'), href: '/dashboard/customers/rewards-system' },
        { title: t('Edit reward system'), href: `/dashboard/customers/rewards-system/edit/${reward.id}` },
      ]}
    />
  );
}
