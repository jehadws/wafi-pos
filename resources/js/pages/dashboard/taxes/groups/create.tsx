import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function CreateTaxGroupPage() {
  const { t } = useTranslation();
  const { title, initialConfig } = usePage<{ title?: string; initialConfig?: CrudFormConfig }>().props;

  return (
    <CrudFormPage
      namespace="sb.taxes-groups"
      initialConfig={initialConfig}
      title={title ?? t('Create a new tax group')}
      description={t('Register a new tax group and save it.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Tax Groups'), href: '/dashboard/taxes/groups' },
        { title: t('Create Tax Group'), href: '/dashboard/taxes/groups/create' },
      ]}
    />
  );
}
