import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useTaxForm } from './use-tax-form';
import { TaxFormFields } from './tax-form-fields';

export default function CreateTaxPage() {
    const { t } = useTranslation();
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Taxes'), href: '/dashboard/taxes' },
    ];
    const { groups } = usePage<{ groups: { name: string; id: number }[] }>().props;

    const { form, handleSubmit, handleInputChange, handleSelectChange } = useTaxForm('create');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create a new tax - JGREM')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new tax')}
                        description={t('Register a new tax and save it.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    <FormField required label={t('Name')} error={form.errors.name} description={t('Provide a name to the tax.')} className="mb-6">
                        <Input
                            id="name"
                            name="name"
                            onChange={handleInputChange}
                            className={cn(form.errors.name && 'border-destructive')}
                            placeholder={t('Provide a name to the tax.')}
                            required
                        />
                    </FormField>

                    <TaxFormFields form={form} groups={groups} handleInputChange={handleInputChange} handleSelectChange={handleSelectChange} />
                </div>
            </form>
        </AppLayout>
    );
}
