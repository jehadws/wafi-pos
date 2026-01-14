import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, useForm } from '@inertiajs/react';

export default function Dashboard() {
    const { t } = useTranslation();
    const form = useForm({
        name: '',
        description: '',
    });

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Unit Groups'), href: '/dashboard/units/groups' },
        { title: t('Create Unit Group'), href: '/dashboard/units/groups/create' },
    ];

    const handleInputChange = (name: keyof typeof form.data, value: string | number | number[]) => {
        form.setData({ ...form.data, [name]: value });

        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        validateStep();
        console.log('Submitting data:', form.data);
        form.post(route('ns.units.postGroup'), {
            showProgress: true,
            onError: (errors) => {
                console.error('Validation errors:', errors);
                if (errors.error) {
                    alert(errors.error);
                }
            },
            onSuccess: (page) => {
                console.log('Property created successfully', page);
            },
        });
    };

    const validateStep = () => {
        let isValid = true;
        form.clearErrors();

        if (!form.data.name.trim()) {
            form.setError('name', t('Name is required'));
            isValid = false;
        }
        return isValid;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create a new unit group - JGREM')} />
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
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField label={t('Description')} htmlFor="description" error={form.errors?.description}>
                            <Textarea
                                id="description"
                                name="description"
                                value={form.data.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={4}
                            />
                        </FormField>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
