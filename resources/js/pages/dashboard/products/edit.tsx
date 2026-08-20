import { Head, usePage } from '@inertiajs/react';

import { useTranslation } from '@/lib/i18n';

import ExpiryTab from '@/components/forms/product-form/expiry-tab';
import IdentificationTab from '@/components/forms/product-form/identification-tab';
import ImagesTab from '@/components/forms/product-form/images-tab';
import TaxesTab from '@/components/forms/product-form/taxes-tab';
import UnitsTab from '@/components/forms/product-form/units-tab';
import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/tabs';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
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
                        description={t('Modify  Product.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    {/* Product Name */}
                    <FormField label={t('Name')} error={form.errors.name} description={t('Provide a name to the resource.')} className="mb-6">
                        <Input
                            id="name"
                            name="name"
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={cn(form.errors.name && 'border-destructive')}
                            value={form.data.name}
                            placeholder={t('Enter product name')}
                            required
                        />
                    </FormField>

                    {/* Tabs */}
                    <Tabs defaultValue="identification" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="identification" className={cn(form.errors?.identification_error ? 'text-destructive' : '')}>
                                {t('Identification')}
                            </TabsTrigger>
                            <TabsTrigger value="units" className={cn(form.errors?.units_error ? 'text-destructive' : '')}>
                                {t('Units')}
                            </TabsTrigger>
                            <TabsTrigger value="expiry" className={cn(form.errors?.expiracy_error ? 'text-destructive' : '')}>
                                {t('Expiry')}
                            </TabsTrigger>
                            <TabsTrigger value="taxes" className={cn(form.errors?.taxes_error ? 'text-destructive' : '')}>
                                {t('Taxes')}
                            </TabsTrigger>
                            <TabsTrigger value="images" className={cn(form.errors?.images_error ? 'text-destructive' : '')}>
                                {t('Images')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="identification" className="mt-6">
                            <IdentificationTab form={form} handleInputChange={handleInputChange} />
                        </TabsContent>

                        <TabsContent value="units" className="mt-6">
                            <UnitsTab form={form} handleInputChange={handleInputChange} />
                        </TabsContent>

                        <TabsContent value="expiry" className="mt-6">
                            <ExpiryTab form={form} handleInputChange={handleInputChange} />
                        </TabsContent>

                        <TabsContent value="taxes" className="mt-6">
                            <TaxesTab form={form} handleInputChange={handleInputChange} />
                        </TabsContent>

                        <TabsContent value="images" className="mt-6">
                            <ImagesTab form={form} handleInputChange={handleInputChange} />
                        </TabsContent>
                    </Tabs>
                </div>
            </form>
        </AppLayout>
    );
}
