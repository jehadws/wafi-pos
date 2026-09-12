import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function CreateTaxPage() {
  const { t } = useTranslation();
  const { title, initialConfig } = usePage<{ title?: string; initialConfig?: CrudFormConfig }>().props;

  return (
    <CrudFormPage
      namespace="sb.taxes"
      initialConfig={initialConfig}
      title={title ?? t('Create a new tax')}
      description={t('Register a new tax and save it.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Taxes'), href: '/dashboard/taxes' },
        { title: t('Create Tax'), href: '/dashboard/taxes/create' },
      ]}
    />
  );
}
