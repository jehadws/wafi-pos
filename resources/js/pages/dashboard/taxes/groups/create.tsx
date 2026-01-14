import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Groups', href: '/dashboard/units/groups' },
];

export default function CreateProductPage() {
    const { t } = useTranslation();
    const form = useForm({
        name: '',
        description: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) return;

        form.transform(() => ({
            name: form.data.name,
            general: {
                description: form.data.description,
            },
        }));

        console.log('Submitting data:', form.data);

        // http://127.0.0.1:9973/api/?
        form.post('/api/crud/ns.taxes-groups', {
            preserveScroll: true,
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error(t('Please fix the validation errors'));
            },
            onSuccess: () => {
                toast.success(t('Successfully saved'));
            },
        });
    };

    const validateForm = () => {
        let isValid = true;
        form.clearErrors();

        if (!form.data.name.trim()) {
            form.setError('name', t('Role name is required'));
            isValid = false;
        }

        return isValid;
    };

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
                            onChange={handleInputChange}
                            className={cn(form.errors.name && 'border-destructive')}
                            placeholder={t('Enter Provider name')}
                            required
                        />
                    </FormField>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <FormField
                                label={t('Description')}
                                htmlFor="description"
                                description={t('Provide a short description to the tax group.')}
                                error={form.errors?.description}
                            >
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={form.data.description}
                                    onChange={handleInputChange}
                                    placeholder={t('Enter Role description')}
                                    rows={4}
                                />
                            </FormField>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
