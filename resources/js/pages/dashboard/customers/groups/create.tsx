import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function CreateCustomerGroupPage() {
  const { t } = useTranslation();
  const { title, initialConfig } = usePage<{ title?: string; initialConfig?: CrudFormConfig }>().props;

  return (
    <CrudFormPage
      namespace="sb.customers-groups"
      initialConfig={initialConfig}
      title={title ?? t('Create a new Customers Group')}
      description={t('Register a new Customers Group and save it.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Customer Groups'), href: '/dashboard/customers/groups' },
        { title: t('Create Customer Group'), href: '/dashboard/customers/groups/create' },
      ]}
    />
  );
}
