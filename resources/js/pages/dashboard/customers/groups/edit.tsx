import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function EditCustomerGroupPage() {
  const { t } = useTranslation();
  const { group, title, initialConfig } = usePage<{
    group: { id: number | string };
    title?: string;
    initialConfig?: CrudFormConfig;
  }>().props;

  return (
    <CrudFormPage
      namespace="sb.customers-groups"
      id={group.id}
      initialConfig={initialConfig}
      title={title ?? t('Edit Customers Group')}
      description={t('Modify Customers group.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Customer Groups'), href: '/dashboard/customers/groups' },
        { title: t('Edit Customer Group'), href: `/dashboard/customers/groups/edit/${group.id}` },
      ]}
    />
  );
}
