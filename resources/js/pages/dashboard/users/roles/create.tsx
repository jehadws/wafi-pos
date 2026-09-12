import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function CreateRolePage() {
  const { t } = useTranslation();
  const { title, initialConfig } = usePage<{ title?: string; initialConfig?: CrudFormConfig }>().props;

  return (
    <CrudFormPage
      namespace="sb.roles"
      initialConfig={initialConfig}
      title={title ?? t('Create a new role')}
      description={t('Create a new role and save it.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Roles'), href: '/dashboard/users/roles' },
        { title: t('Create'), href: '/dashboard/users/roles/create' },
      ]}
    />
  );
}
