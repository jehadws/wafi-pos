import FormHeader from '@/components/forms/shared/form-header';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { Head, usePage } from '@inertiajs/react';
import { ProductFormFields } from './product-form-fields';
import { useProductForm } from './use-product-form';

export default function EditProductPage() {
  const { t } = useTranslation();
  const { product } = usePage<{ product: any }>().props;
  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Products'), href: '/dashboard/products' },
    { title: t('Edit Product'), href: '/dashboard/products/edit' },
  ];

  const { form, handleSubmit, handleInputChange } = useProductForm('edit', product);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Edit product')} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title={t('Edit product')}
            description={t('Modify Product.')}
            onCancel={() => window.history.back()}
            onSave={() => {}}
            form={form}
          />

          <ProductFormFields form={form} handleInputChange={handleInputChange} />
        </div>
      </form>
    </AppLayout>
  );
}
