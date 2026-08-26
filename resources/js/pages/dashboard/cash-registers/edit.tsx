import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';

type RegisterEntry = {
    id: number;
    name: string;
    status: string;
    description?: string | null;
};

export default function EditCashRegister() {
    const { t } = useTranslation();
    const { register } = usePage<{ register: RegisterEntry }>().props;

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Cash Registers'), href: '/dashboard/cash-registers' },
        { title: t('Edit register'), href: `/dashboard/cash-registers/edit/${register.id}` },
    ];

    const form = useForm({
        name: register.name || '',
        status: register.status || 'closed',
        description: register.description || '',
    });

    const handleInputChange = (name: keyof typeof form.data, value: string) => {
        form.setData({ ...form.data, [name]: value });

        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const data = {
            name: form.data.name,
            general: {
                status: form.data.status,
                description: form.data.description,
            },
        };

        form.transform(() => data);

        form.put(`/api/crud/ns.cash-registers/${register.id}`, {
            showProgress: true,
            onError: (errors) => {
                console.error('Validation errors:', errors);
                if (errors.error) {
                    toast.error(errors.error);
                }
            },
            onSuccess: () => {
                toast.info(t('Successfully saved'));
            },
        });
    };

    const validateForm = () => {
        let isValid = true;
        form.clearErrors();
        if (!form.data.name.trim()) {
            form.setError('name', t('The name is required.'));
            isValid = false;
        }
        if (!form.data.status) {
            form.setError('status', t('The status is required.'));
            isValid = false;
        }
        return isValid;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Edit register')} />
            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Edit register')}
                        description={t('Modify  Register.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    <FormField label={t('Name')} error={form.errors.name} description={t('Provide a name to the resource.')} required>
                        <Input
                            id="name"
                            name="name"
                            value={form.data.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={cn(form.errors.name && 'border-destructive')}
                            required
                        />
                    </FormField>
                    <Separator />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <FormField label={t('Status')} error={form.errors.status} description={t('Define what is the status of the register.')} required>
                            <Select value={form.data.status} onValueChange={(value) => handleInputChange('status', value)}>
                                <SelectTrigger className={cn('w-full', form.errors.status && 'border-destructive')}>
                                    <SelectValue placeholder={t('Choose an option')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="disabled">{t('Disabled')}</SelectItem>
                                    <SelectItem value="closed">{t('Closed')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField label={t('Description')} error={form.errors.description} description={t('Provide mode details about this cash register.')}>
                            <Textarea
                                id="description"
                                name="description"
                                rows={5}
                                value={form.data.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className={cn(form.errors.description && 'border-destructive')}
                            />
                        </FormField>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
