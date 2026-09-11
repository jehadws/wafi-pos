import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import { UnitFormFields } from './unit-form-fields';
import { useUnitForm } from './use-unit-form';

export default function EditUnitPage() {
  const { t } = useTranslation();
  const { unit, groups } = usePage<{ unit: any; groups: { name: string; id: number }[] }>().props;
  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Units'), href: '/dashboard/units' },
    { title: t('Edit Unit'), href: '/dashboard/units/edit' },
  ];

  const { form, handleSubmit, handleInputChange } = useUnitForm('edit', unit);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Edit unit')} />
      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader title={t('Edit unit')} description={t('Modify Unit.')} onCancel={() => window.history.back()} onSave={() => {}} form={form} />

          <FormField label={t('Name')} error={form.errors.name} description={t('Provide a name to the resource.')} className="mb-6" required>
            <Input
              id="name"
              name="name"
              value={form.data.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={cn(form.errors.name && 'border-destructive')}
              required
            />
          </FormField>

          <UnitFormFields form={form} unitGroups={groups} handleInputChange={handleInputChange} />
        </div>
      </form>
    </AppLayout>
  );
}
