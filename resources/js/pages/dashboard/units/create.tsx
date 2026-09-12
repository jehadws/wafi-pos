import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function CreateUnitPage() {
  const { t } = useTranslation();
  const { title, initialConfig } = usePage<{ title?: string; initialConfig?: CrudFormConfig }>().props;

  return (
    <CrudFormPage
      namespace="sb.units"
      initialConfig={initialConfig}
      title={title ?? t('Create a new unit')}
      description={t('Register a new unit and save it.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Units'), href: '/dashboard/units' },
        { title: t('Create Unit'), href: '/dashboard/units/create' },
      ]}
    />
  );
}
