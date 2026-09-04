import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { useUnitGroupForm } from './use-unit-group-form';
import { UnitGroupFormFields } from './unit-group-form-fields';

export default function CreateUnitGroupPage() {
    const { t } = useTranslation();
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Unit Groups'), href: '/dashboard/units/groups' },
        { title: t('Create Unit Group'), href: '/dashboard/units/groups/create' },
    ];

    const { form, handleSubmit, handleInputChange } = useUnitGroupForm('create');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create a new unit group')} />
            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new unit group')}
                        description={t('Register a new unit group and save it.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    <FormField label={t('Name')} error={form.errors.name} description={t('Provide a name to the resource.')} className="mb-6">
                        <Input
                            id="name"
                            name="name"
                            value={form.data.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={cn(form.errors.name && 'border-destructive')}
                            required
                        />
                    </FormField>

                    <UnitGroupFormFields form={form} handleInputChange={handleInputChange} />
                </div>
            </form>
        </AppLayout>
    );
}
