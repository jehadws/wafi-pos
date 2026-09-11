import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import { TaxGroupFormFields } from './tax-group-form-fields';
import { useTaxGroupForm } from './use-tax-group-form';

export default function EditTaxGroupPage() {
  const { t } = useTranslation();
  const { group } = usePage<{ group: { id: number; name: string; description: string | null } }>().props;

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Tax Groups'), href: '/dashboard/taxes/groups' },
    { title: t('Edit Tax Group'), href: `/dashboard/taxes/groups/${group?.id}/edit` },
  ];

  const { form, handleSubmit, handleInputChange } = useTaxGroupForm('edit', group);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Edit tax group')} />
      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title={t('Edit tax group')}
            description={t('Modify Tax Group.')}
            onCancel={() => window.history.back()}
            onSave={() => {}}
            form={form}
          />

          <FormField label={t('Name')} error={form.errors.name} description={t('Provide a name to the resource.')} className="mb-6">
            <Input
              id="name"
              name="name"
              onChange={handleInputChange}
              value={form.data.name}
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
