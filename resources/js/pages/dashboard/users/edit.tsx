/**
 * pages/dashboard/users/edit.tsx
 *
 * Thin wrapper — delegates all form logic to useUserForm('edit', user).
 * Fixed: was incorrectly named CreateProductPage.
 */

import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import { useUserForm } from './use-user-form';
import { UserFormFields } from './user-form-fields';

export default function EditUserPage() {
  const { t } = useTranslation();

  const { groups, roles, user } = usePage<{
    groups: { id: number; name: string }[];
    roles: { id: number; name: string }[];
    user: any;
  }>().props;

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Users'), href: '/dashboard/users' },
    { title: t('Edit user'), href: `/dashboard/users/${user?.id}/edit` },
  ];

  const { form, handleSubmit, handleInputChange, handleSelectChange } = useUserForm('edit', user);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Edit user')} />

      <form onSubmit={handleSubmit}>
        <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
          <FormHeader
            title={t('Edit user')}
            description={t('Update user information and save.')}
            onCancel={() => window.history.back()}
            onSave={() => {}}
            form={form}
          />

          <FormField label={t('Username')} error={form.errors.username} description={t('Provide a name to the resource.')} className="mb-2">
            <Input
              id="username"
              name="username"
              value={form.data.username}
              onChange={handleInputChange}
              className={cn(form.errors.username && 'border-destructive')}
            />
          </FormField>

          <UserFormFields form={form} groups={groups} roles={roles} handleInputChange={handleInputChange} handleSelectChange={handleSelectChange} />
        </div>
      </form>
    </AppLayout>
  );
}
