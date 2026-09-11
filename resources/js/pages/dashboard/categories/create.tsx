import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function CreateCategoryPage() {
  const { t } = useTranslation();
  const { title, initialConfig } = usePage<{ title?: string; initialConfig?: CrudFormConfig }>().props;

  return (
    <CrudFormPage
      namespace="sb.products-categories"
      initialConfig={initialConfig}
      title={title ?? t('Create a new category product')}
      description={t('Register a new category product and save it.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Category Products'), href: '/dashboard/products/categories' },
        { title: t('Create Category Products'), href: '/dashboard/products/categories/create' },
      ]}
    />
  );
}
