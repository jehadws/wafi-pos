/**
 * pages/dashboard/customers/edit.tsx — thin wrapper
 * Fixed: was named CreateProductPage → EditCustomerPage
 */
import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import { CustomerFormFields } from './customer-form-fields';
import { useCustomerForm } from './use-customer-form';

export default function EditCustomerPage() {
  const { t } = useTranslation();
  const { groups, customer } = usePage<{ groups: { id: number; name: string }[]; customer: any }>().props;
  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Customers'), href: '/dashboard/customers' },
    { title: t('Edit customer'), href: `/dashboard/customers/${customer?.id}/edit` },
  ];
  const { form, handleSubmit, handleInputChange, handleSelectChange } = useCustomerForm('edit', customer);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Edit customer')} />
      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title={t('Edit customer')}
            description={t('Update customer information and save.')}
            onCancel={() => window.history.back()}
            onSave={() => {}}
            form={form}
          />
          <FormField label={t('Name')} error={form.errors.first_name} description={t('Provide a name to the resource.')} className="mb-6">
            <Input
              id="first_name"
              name="first_name"
              value={form.data.first_name}
              onChange={handleInputChange}
              className={cn(form.errors.first_name && 'border-destructive')}
              placeholder={t('Enter Customer name')}
              required
            />
          </FormField>
          <CustomerFormFields form={form} groups={groups} handleInputChange={handleInputChange} handleSelectChange={handleSelectChange} />
        </div>
      </form>
    </AppLayout>
  );
}
