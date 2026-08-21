import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useProcurementForm } from './use-procurement-form';
import { ProcurementGeneralTab } from './procurement-general-tab';
import { ProcurementProductsTab } from './procurement-products-tab';
import { ProcurementItemModals } from './procurement-item-modals';

export default function CreateProcurementPage() {
    const { t } = useTranslation();
    const { providers, tax_groups } = usePage<{
        providers: { id: number; name: string }[];
        tax_groups: { id: number; name: string }[];
    }>().props;

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Procurements'), href: '/dashboard/procurements' },
        { title: t('Create Procurement'), href: '/dashboard/procurements/create' },
    ];

    const {
        form,
        searchQuery,
        setSearchQuery,
        searchResults,
        units,
        setUnits,
        activeModal,
        setActiveModal,
        handleInputChange,
        addProduct,
        removeProduct,
        updateProduct,
        searchProduct,
        getConvertUnits,
        handleSubmit,
    } = useProcurementForm();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create Procurement')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new procurement')}
                        description={t('Register a new procurement and save it.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    <FormField
                        label={t('Procurement Name')}
                        error={form.errors.name}
                        description={t('Provide a name that will help to identify the procurement.')}
                        className="mb-6"
                    >
                        <Input
                            id="name"
                            name="name"
                            value={form.data.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={cn(form.errors.name && 'border-destructive')}
                            placeholder={t('Enter product name')}
                            required
                        />
                    </FormField>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="general">{t('General')}</TabsTrigger>
                            <TabsTrigger value="products">{t('Products')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="mt-6">
                            <ProcurementGeneralTab
                                form={form}
                                providers={providers}
                                handleInputChange={handleInputChange}
                            />
                        </TabsContent>

                        <TabsContent value="products" className="mt-6">
                            <ProcurementProductsTab
                                form={form}
                                searchQuery={searchQuery}
                                searchResults={searchResults}
                                taxGroups={tax_groups}
                                onSearchQueryChange={setSearchQuery}
                                onSearch={searchProduct}
                                onSelectProduct={addProduct}
                                onUpdateProduct={updateProduct}
                                onRemoveProduct={removeProduct}
                                onOpenModal={setActiveModal}
                                onGetConvertUnits={getConvertUnits}
                            />
                        </TabsContent>
                    </Tabs>

                    <ProcurementItemModals
                        form={form}
                        activeModal={activeModal}
                        taxGroups={tax_groups}
                        units={units}
                        onCloseModal={() => {
                            setUnits([]);
                            setActiveModal({ type: null, product_id: null, group_id: null });
                        }}
                        onUpdateProduct={updateProduct}
                    />
                </div>
            </form>
        </AppLayout>
    );
}
