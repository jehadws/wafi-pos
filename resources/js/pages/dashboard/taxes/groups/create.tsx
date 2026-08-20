import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useTaxGroupForm } from './use-tax-group-form';
import { TaxGroupFormFields } from './tax-group-form-fields';

export default function CreateTaxGroupPage() {
    const { t } = useTranslation();
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Tax Groups'), href: '/dashboard/taxes/groups' },
        { title: t('Create Tax Group'), href: '/dashboard/taxes/groups/create' },
    ];

    const { form, handleSubmit, handleInputChange } = useTaxGroupForm('create');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create a new tax group')} />
            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new tax group')}
                        description={t('Register a new tax group and save it.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    <FormField label={t('Name')} error={form.errors.name} description={t('Provide a name to the resource.')} className="mb-6">
                        <Input
                            id="name"
                            name="name"
                            value={form.data.name}
                            onChange={handleInputChange}
                            className={cn(form.errors.name && 'border-destructive')}
                            placeholder={t('Enter Tax Group name')}
                            required
                        />
                    </FormField>

                    <TaxGroupFormFields form={form} handleInputChange={handleInputChange} />
                </div>
            </form>
        </AppLayout>
    );
}
