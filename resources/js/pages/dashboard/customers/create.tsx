/**
 * pages/dashboard/customers/create.tsx — thin wrapper
 */
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useCustomerForm } from './use-customer-form';
import { CustomerFormFields } from './customer-form-fields';

export default function CreateCustomerPage() {
    const { t } = useTranslation();
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Customers'), href: '/dashboard/customers' },
        { title: t('Create Customer'), href: '/dashboard/customers/create' },
    ];
    const { groups } = usePage<{ groups: { id: number; name: string }[] }>().props;
    const { form, handleSubmit, handleInputChange, handleSelectChange } = useCustomerForm('create');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create a new customer')} />
            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader title={t('Create a new customer')} description={t('Register a new customer and save it.')} onCancel={() => window.history.back()} onSave={() => {}} form={form} />
                    <FormField label={t('Name')} error={form.errors.first_name} description={t('Provide a name to the resource.')} className="mb-6">
                        <Input id="first_name" name="first_name" value={form.data.first_name} onChange={handleInputChange} className={cn(form.errors.first_name && 'border-destructive')} placeholder={t('Enter Customer name')} required />
                    </FormField>
                    <CustomerFormFields form={form} groups={groups} handleInputChange={handleInputChange} handleSelectChange={handleSelectChange} />
                </div>
            </form>
        </AppLayout>
    );
}
