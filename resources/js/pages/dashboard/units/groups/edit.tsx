import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import { useUnitGroupForm } from './use-unit-group-form';
import { UnitGroupFormFields } from './unit-group-form-fields';

export default function EditUnitGroupPage() {
    const { t } = useTranslation();
    const { group } = usePage<{ group: any }>().props;

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Unit Groups'), href: '/dashboard/units/groups' },
        { title: t('Edit Unit Group'), href: '/dashboard/units/groups/edit' },
    ];

    const { form, handleSubmit, handleInputChange } = useUnitGroupForm('edit', group);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Edit unit group - Subul')} />
            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Edit unit group')}
                        description={t('Modify Unit Group and save it.')}
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
