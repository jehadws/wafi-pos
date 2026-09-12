import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function EditTaxGroupPage() {
  const { t } = useTranslation();
  const { group, title, initialConfig } = usePage<{
    group: { id: number | string };
    title?: string;
    initialConfig?: CrudFormConfig;
  }>().props;

  return (
    <CrudFormPage
      namespace="sb.taxes-groups"
      id={group.id}
      initialConfig={initialConfig}
      title={title ?? t('Edit tax group')}
      description={t('Modify Tax Group.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Tax Groups'), href: '/dashboard/taxes/groups' },
        { title: t('Edit Tax Group'), href: `/dashboard/taxes/groups/${group.id}/edit` },
      ]}
    />
  );
}
