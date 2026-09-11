import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function EditRolePage() {
  const { t } = useTranslation();
  const { role, title, initialConfig } = usePage<{ role: Role; title?: string; initialConfig?: CrudFormConfig }>().props;

  return (
    <CrudFormPage
      namespace="sb.roles"
      id={role.id}
      initialConfig={initialConfig}
      title={title ?? t('Edit role')}
      description={t('Modify Role.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Roles'), href: '/dashboard/users/roles' },
        { title: t('Edit'), href: `/dashboard/users/roles/edit/${role.id}` },
      ]}
    />
  );
}
