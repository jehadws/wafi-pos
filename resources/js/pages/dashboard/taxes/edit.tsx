import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function EditTaxPage() {
  const { t } = useTranslation();
  const { tax, title, initialConfig } = usePage<{
    tax: { id: number | string };
    title?: string;
    initialConfig?: CrudFormConfig;
  }>().props;

  return (
    <CrudFormPage
      namespace="sb.taxes"
      id={tax.id}
      initialConfig={initialConfig}
      title={title ?? t('Edit tax')}
      description={t('Modify  Tax.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Taxes'), href: '/dashboard/taxes' },
        { title: t('Edit Tax'), href: `/dashboard/taxes/${tax.id}/edit` },
      ]}
    />
  );
}
