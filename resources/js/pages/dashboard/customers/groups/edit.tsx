import FormHeader from '@/components/forms/shared/form-header';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { Head, usePage } from '@inertiajs/react';
import { CustomerGroupFormFields } from './customer-group-form-fields';
import { useCustomerGroupForm } from './use-customer-group-form';

export default function EditCustomerGroupPage() {
  const { t } = useTranslation();

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Customer Groups'), href: '/dashboard/customers/groups' },
    { title: t('Edit Customer Group'), href: '/dashboard/customers/groups/edit' },
  ];
  const { rewards, group } = usePage<{ rewards: any[]; group: any }>().props;

  const { form, handleSubmit, handleInputChange, handleSelectChange } = useCustomerGroupForm('edit', group);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Edit Customers Group')} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title={t('Edit Customers Group')}
            description={t('Modify Customers group.')}
            onCancel={() => window.history.back()}
            onSave={() => {}}
            form={form}
          />

          <CustomerGroupFormFields form={form} rewards={rewards} handleInputChange={handleInputChange} handleSelectChange={handleSelectChange} />
        </div>
      </form>
    </AppLayout>
  );
}
