import FormHeader from '@/components/forms/shared/form-header';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { Head, usePage } from '@inertiajs/react';
import React from 'react';
import { useCustomerGroupForm } from './use-customer-group-form';
import { CustomerGroupFormFields } from './customer-group-form-fields';

export default function CreateCustomerGroupPage() {
    const { t } = useTranslation();
    const { rewards } = usePage<{ rewards: any[] }>().props;

    const { form, handleSubmit, handleInputChange, handleSelectChange } = useCustomerGroupForm('create');

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('Dashboard'), href: '/dashboard' },
                { title: t('Customer Groups'), href: '/dashboard/customers/groups' },
                { title: t('Create Customer Group'), href: '/dashboard/customers/groups/create' },
            ]}
        >
            <Head title={t('Create a new Customers Group - JGREM')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new Customers Group')}
                        description={t('Register a new Customers Group and save it.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    <CustomerGroupFormFields
                        form={form}
                        rewards={rewards}
                        handleInputChange={handleInputChange}
                        handleSelectChange={handleSelectChange}
                    />
                </div>
            </form>
        </AppLayout>
    );
}
