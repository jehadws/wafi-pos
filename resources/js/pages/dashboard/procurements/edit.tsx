import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import { ProcurementGeneralTab } from './procurement-general-tab';
import { ProcurementItemModals } from './procurement-item-modals';
import { ProcurementProductsTab } from './procurement-products-tab';
import { ProcurementInitialData, useProcurementForm } from './use-procurement-form';

interface EditProcurementProps {
  procurement: ProcurementInitialData & {
    id: number;
    products: any[];
  };
  providers: { id: number; name: string }[];
  tax_groups: { id: number; name: string; taxes?: { id: number; rate: number }[] }[];
}

export default function EditProcurementPage() {
  const { t } = useTranslation();
  const { procurement, providers, tax_groups } = usePage<Record<string, unknown> & EditProcurementProps>().props;

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Procurements'), href: '/dashboard/procurements' },
    { title: t('Edit Procurement'), href: '#' },
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
  } = useProcurementForm({
    id: procurement.id,
    name: procurement.name,
    automatic_approval: procurement.automatic_approval ?? 1,
    delivery_status: procurement.delivery_status ?? 'delivered',
    delivery_time: procurement.delivery_time,
    invoice_date: procurement.invoice_date,
    invoice_reference: procurement.invoice_reference ?? '',
    payment_status: procurement.payment_status ?? 'paid',
    provider_id: procurement.provider_id ?? '',
    products: procurement.products ?? [],
  });

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Edit Procurement')} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title={t('Edit procurement')}
            description={t('Perform adjustment on existing procurement.')}
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
              placeholder={t('Enter procurement name')}
              required
            />
          </FormField>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">{t('General')}</TabsTrigger>
              <TabsTrigger value="products">{t('Products')}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <ProcurementGeneralTab form={form} providers={providers} handleInputChange={handleInputChange} />
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
