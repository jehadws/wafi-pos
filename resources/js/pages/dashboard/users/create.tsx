/**
 * pages/dashboard/users/create.tsx
 *
 * Thin wrapper — delegates all form logic to useUserForm('create').
 */

import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useUserForm } from './use-user-form';
import { UserFormFields } from './user-form-fields';

export default function CreateUserPage() {
    const { t } = useTranslation();
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Users'), href: '/dashboard/users' },
        { title: t('Create User'), href: '/dashboard/users/create' },
    ];

    const { groups, roles } = usePage<{
        groups: { id: number; name: string }[];
        roles: { id: number; name: string }[];
    }>().props;

    const { form, handleSubmit, handleInputChange, handleSelectChange } = useUserForm('create');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create a new user') + ' - JGREM'} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new user')}
                        description={t('Register a new user and save it.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    <FormField
                        label={t('Username')}
                        error={form.errors.username}
                        description={t('Provide a name to the resource.')}
                        className="mb-2"
                    >
                        <Input
                            id="username"
                            name="username"
                            value={form.data.username}
                            onChange={handleInputChange}
                            className={cn(form.errors.username && 'border-destructive')}
                        />
                    </FormField>

                    <UserFormFields
                        form={form}
                        groups={groups}
                        roles={roles}
                        handleInputChange={handleInputChange}
                        handleSelectChange={handleSelectChange}
                    />
                </div>
            </form>
        </AppLayout>
    );
}
