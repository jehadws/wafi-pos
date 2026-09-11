import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import { CategoryFormFields } from './category-form-fields';
import { useCategoryForm } from './use-category-form';

export default function EditCategoryPage() {
  const { t } = useTranslation();
  const { category, categories } = usePage<{ category: any; categories: any[] }>().props;
  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Category Products'), href: '/dashboard/products/categories' },
    { title: t('Edit Category Products'), href: '/dashboard/products/categories/edit' },
  ];

  const { form, handleSubmit, handleInputChange } = useCategoryForm('edit', category);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Edit category product')} />
      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title={t('Edit category product')}
            description={t('Modify Category Product.')}
            onCancel={() => window.history.back()}
            onSave={() => {}}
            form={form}
          />

          <FormField label={t('Name')} error={form.errors.name} description={t('Provide a name to the resource.')} className="mb-4" required>
            <Input
              id="name"
              name="name"
              value={form.data.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={cn(form.errors.name && 'border-destructive')}
              required
            />
          </FormField>

          <CategoryFormFields form={form} categories={categories} handleInputChange={handleInputChange} />
        </div>
      </form>
    </AppLayout>
  );
}
