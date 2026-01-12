import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Select } from '@radix-ui/react-select';
import React from 'react';
import { toast } from 'sonner';

export default function CreateRewardSystemPage() {
    const { t } = useTranslation();
    const { rewards } = usePage<{ rewards: Coupon[] }>().props;

    const form = useForm({
        name: '',
        reward_system_id: '',
        minimal_credit_payment: '',
        description: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSelectChange = (name: string, value: string | number | number[]) => {
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
                reward_system_id: form.data.reward_system_id,
                minimal_credit_payment: form.data.minimal_credit_payment,
                description: form.data.description,
            },
        }));

        form.post('/api/crud/ns.customers-groups', {
            preserveScroll: true,
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error(t('Please fix the validation errors'));
            },
            onSuccess: () => {
                toast.success(t('Customer group created successfully'));
            },
        });
    };

    const validateForm = () => {
        let isValid = true;
        form.clearErrors();

        if (!form.data.name?.trim()) {
            form.setError('name', t('Name is required'));
            isValid = false;
        }

        return isValid;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('Dashboard'), href: '/dashboard' },
                { title: t('Customer Groups'), href: '/dashboard/customers/groups' },
            ]}
        >
            <Head title={t('Create a new Customers Group - JGREM')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new Customers Group')}
                        description={t('Register a new Customers Group and save it.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    <div className="grid grid-cols-1 gap-6 space-y-6 md:grid-cols-2">
                        <FormField label={t('Name')} description={t('Provide a name to the resource.')} error={form.errors.name}>
                            <Input
                                id="name"
                                name="name"
                                onChange={handleInputChange}
                                className={cn(form.errors.name && 'border-destructive')}
                                value={form.data.name}
                                placeholder={t('e.g., Summer Sale 2024')}
                            />
                        </FormField>
                        <FormField
                            label={t('Reward System')}
                            description={t('Select which Reward system applies to the group')}
                            htmlFor="reward_system_id"
                            error={form.errors.reward_system_id}
                        >
                            <Select onValueChange={(value) => handleSelectChange('reward_system_id', +value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {rewards.map((reward) => {
                                        return (
                                            <SelectItem key={reward.id} value={reward.id.toString()}>
                                                <div className="flex items-center gap-2">{reward.name}</div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField
                            label={t('Minimum Credit Amount')}
                            description={t('A brief description about what this group is about')}
                            htmlFor="minimal_credit_payment"
                            error={form.errors.minimal_credit_payment}
                        >
                            <Input
                                placeholder={t('e.g., 200')}
                                id="minimal_credit_payment"
                                name="minimal_credit_payment"
                                value={form.data.minimal_credit_payment}
                                onChange={handleInputChange}
                                type="number"
                                className={cn(form.errors.minimal_credit_payment && 'border-destructive', 'uppercase')}
                            />
                        </FormField>
                        <FormField
                            label={t('Description')}
                            description={t('Optional description for internal use')}
                            htmlFor="description"
                            error={form.errors.description}
                        >
                            <Textarea
                                id="description"
                                name="description"
                                value={form.data.description}
                                onChange={handleInputChange}
                                placeholder={t('Describe the purpose of this customer group...')}
                                className={cn(form.errors.description && 'border-destructive', 'min-h-[80px]')}
                            />
                        </FormField>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
