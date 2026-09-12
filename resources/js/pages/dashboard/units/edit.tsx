import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function EditUnitPage() {
  const { t } = useTranslation();
  const { unit, title, initialConfig } = usePage<{
    unit: { id: number | string };
    title?: string;
    initialConfig?: CrudFormConfig;
  }>().props;

  return (
    <CrudFormPage
      namespace="sb.units"
      id={unit.id}
      initialConfig={initialConfig}
      title={title ?? t('Edit unit')}
      description={t('Modify Unit.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Units'), href: '/dashboard/units' },
        { title: t('Edit Unit'), href: `/dashboard/units/edit/${unit.id}` },
      ]}
    />
  );
}
