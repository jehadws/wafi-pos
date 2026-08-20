import { Head } from '@inertiajs/react';
import FormHeader from '@/components/forms/shared/form-header';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { ProductFormFields } from './product-form-fields';
import { useProductForm } from './use-product-form';

export default function CreateProductPage() {
    const { t } = useTranslation();
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Products'), href: '/dashboard/products' },
        { title: t('Create Product'), href: '/dashboard/products/create' },
    ];

    const { form, handleSubmit, handleInputChange } = useProductForm('create');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create a new product')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new product')}
                        description={t('Register a new product and save it.')}
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
