import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function EditCategoryPage() {
  const { t } = useTranslation();
  const { category, title, initialConfig } = usePage<{
    category: { id: number | string };
    title?: string;
    initialConfig?: CrudFormConfig;
  }>().props;

  return (
    <CrudFormPage
      namespace="sb.products-categories"
      id={category.id}
      initialConfig={initialConfig}
      title={title ?? t('Edit category product')}
      description={t('Modify Category Product.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Category Products'), href: '/dashboard/products/categories' },
        { title: t('Edit Category Products'), href: `/dashboard/products/categories/edit/${category.id}` },
      ]}
    />
  );
}
