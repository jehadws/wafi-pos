import { rewardsApi } from '@/api';
import { SbCrudForm } from '@/components/forms/config-form/sb-crud-form';
import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { FormFieldDef } from '@/types/forms';
import { extractValidationErrors } from '@/utils/api-errors';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface RewardRule {
    id: string;
    from: number;
    to: number;
    reward: number;
}

type FormData = {
    name: string;
    coupon_id: number;
    target: number;
    description: string;
    rules: RewardRule[];
};

export default function CreateRewardSystemPage() {
    const { t } = useTranslation();
    const { coupons } = usePage<{ coupons: Coupon[] }>().props;

    const couponField: FormFieldDef = {
        name: 'coupon_id',
        label: t('Coupon'),
        type: 'search-select',
        component: 'sbCreateCoupons',
        namespace: 'sb.coupons',
        options: coupons.map((coupon) => ({ label: coupon.name, value: coupon.id })),
        description: t('Decide which coupon you would apply to the system.'),
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Coupons'), href: '/dashboard/customers/coupons' },
    ];

    const form = useForm<FormData>({
        name: '',
        coupon_id: 0,
        target: 0,
        description: '',
        rules: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        form.setData({ ...form.data, [name]: value });
        // @ts-expect-error Inertia form type
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSelectChange = (name: string, value: string | number | number[]) => {
        form.setData({ ...form.data, [name]: value });
        // @ts-expect-error Inertia form type
        if (form.errors[name]) form.clearErrors(name);
    };

    const addRule = () => {
        const id = Date.now().toString();
        const newRule = {
            id: id,
            from: '' as any,
            to: '' as any,
            reward: '' as any,
        } as RewardRule;
        form.setData({ ...form.data, rules: [...form.data.rules, newRule] });
        // @ts-expect-error Inertia form type
        if (form.errors[`rules.${id}.from`]) form.clearErrors(`rules.${id}.from`);
        // @ts-expect-error Inertia form type
        if (form.errors[`rules.${id}.to`]) form.clearErrors(`rules.${id}.to`);
        // @ts-expect-error Inertia form type
        if (form.errors[`rules.${id}.reward`]) form.clearErrors(`rules.${id}.reward`);
    };

    const removeRule = (id: string) => {
        form.setData({ ...form.data, rules: form.data.rules.filter((rule) => rule.id !== id) });

        // clear errors
        // @ts-expect-error Inertia form type
        if (form.errors[`rules.${id}.from`]) form.clearErrors(`rules.${id}.from`);
        // @ts-expect-error Inertia form type
        if (form.errors[`rules.${id}.to`]) form.clearErrors(`rules.${id}.to`);
        // @ts-expect-error Inertia form type
        if (form.errors[`rules.${id}.reward`]) form.clearErrors(`rules.${id}.reward`);
    };

    const updateRule = (id: string, field: keyof RewardRule, value: string) => {
        form.setData({ ...form.data, rules: form.data.rules.map((rule) => (rule.id === id ? { ...rule, [field]: value } : rule)) });

        // @ts-expect-error Inertia form type
        if (form.errors[`rules.${id}.${field}`]) form.clearErrors(`rules.${id}.${field}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm() || isSubmitting) return;
        setIsSubmitting(true);

        const rules = form.data.rules.map((rule) => ({
            from: +rule.from,
            to: +rule.to,
            reward: +rule.reward,
        }));

        try {
            const res = await rewardsApi.create({
                name: form.data.name,
                general: {
                    coupon_id: form.data.coupon_id,
                    target: form.data.target,
                    description: form.data.description,
                },
                rules: rules,
            });
            toast.success(t('Reward System created successfully'));
            if (res?.redirect) router.visit(res.redirect);
        } catch (err) {
            const errors = extractValidationErrors(err);
            console.error('Validation errors:', errors);
            toast.error(t('Please fix the validation errors'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateForm = () => {
        let isValid = true;
        form.clearErrors();

        if (!form.data.name?.trim()) {
            form.setError('name', t('Name is required'));
            isValid = false;
        }

        if (!form.data.coupon_id) {
            form.setError('coupon_id', t('Coupon is required'));
            isValid = false;
        }

        if (!form.data.target) {
            form.setError('target', t('Target is required'));
            isValid = false;
        }

        try {
            if (form.data.rules.length === 0) {
                form.setError('rules', t('At least one rule is required'));
                toast.error(t('At least one rule is required'));
                isValid = false;
            } else {
                form.data.rules.forEach((rule) => {
                    if (!rule.from) {
                        (form as any).setError(`rules.${rule.id}.from`, t('From value is required.'));
                        isValid = false;
                    }

                    if (!rule.to) {
                        (form as any).setError(`rules.${rule.id}.to`, t('To value is required.'));
                        isValid = false;
                    }

                    if (!rule.reward) {
                        (form as any).setError(`rules.${rule.id}.reward`, t('Points value is required.'));
                        isValid = false;
                    }
                });
            }
        } catch {
            form.setError('rules', t('Invalid rules format'));
            isValid = false;
        }

        return isValid;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create a new reward system')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new reward system')}
                        description={t('Register a new reward system and save it.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={{ ...form, processing: isSubmitting || form.processing }}
                    />

                    <div className="grid grid-cols-1 gap-6 space-y-6 md:grid-cols-3">
                        <div className="col-span-1 flex flex-col gap-6">
                            <FormField label={t('Coupon Name')} description={t('Provide a name to the resource.')} error={form.errors.name}>
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
                                label={t('Coupon')}
                                description={t('Decide which coupon you would apply to the system.')}
                                htmlFor="coupon_id"
                                error={form.errors.coupon_id}
                            >
                                <SbCrudForm
                                    field={couponField}
                                    value={form.data.coupon_id}
                                    onChange={(value) => handleSelectChange('coupon_id', value as number)}
                                    error={form.errors.coupon_id}
                                    id="coupon_id"
                                />
                            </FormField>

                            <FormField
                                label={t('Target')}
                                description={t('This is the objective that the user should reach to trigger the reward.')}
                                htmlFor="target"
                                error={form.errors.target}
                            >
                                <Input
                                    placeholder={t('e.g., 200')}
                                    id="target"
                                    name="target"
                                    value={form.data.target}
                                    onChange={handleInputChange}
                                    type="number"
                                    className={cn(form.errors.target && 'border-destructive', 'uppercase')}
                                />
                            </FormField>
                            <FormField
                                label={t('Description')}
                                description={t('A short description about this system')}
                                htmlFor="description"
                                error={form.errors.description}
                            >
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={form.data.description}
                                    onChange={handleInputChange}
                                    placeholder={t('Describe the purpose of this coupon...')}
                                    className={cn(form.errors.description && 'border-destructive', 'min-h-[80px]')}
                                />
                            </FormField>

                            <Button type="button" onClick={addRule} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="me-2 h-4 w-4" />
                                {t('Add Rule')}
                            </Button>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {form.data.rules.map((rule) => (
                                    <Card key={rule.id} className="relative">
                                        <CardContent className="p-4">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute end-2 top-2 h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => removeRule(rule.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>

                                            <div className="flex flex-col gap-4">
                                                <FormField
                                                    label={t('From')}
                                                    description={t('The interval start here.')}
                                                    error={(form.errors as any)[`rules.${rule.id}.from`]}
                                                >
                                                    <Input
                                                        id="from"
                                                        name="from"
                                                        className={cn((form.errors as any)[`rules.${rule.id}.from`] && 'border-destructive')}
                                                        type="number"
                                                        placeholder={t('e.g., 200')}
                                                        value={rule.from}
                                                        onChange={(e) => updateRule(rule.id, 'from', e.target.value)}
                                                    />
                                                </FormField>

                                                <FormField
                                                    label={t('To')}
                                                    description={t('The interval ends here.')}
                                                    error={(form.errors as any)[`rules.${rule.id}.to`]}
                                                >
                                                    <Input
                                                        id="to"
                                                        name="to"
                                                        className={cn((form.errors as any)[`rules.${rule.id}.to`] && 'border-destructive')}
                                                        type="number"
                                                        placeholder={t('e.g., 400')}
                                                        value={rule.to}
                                                        onChange={(e) => updateRule(rule.id, 'to', e.target.value)}
                                                    />
                                                </FormField>
                                                <FormField
                                                    label={t('Points')}
                                                    description={t('Points earned.')}
                                                    error={(form.errors as any)[`rules.${rule.id}.reward`]}
                                                >
                                                    <Input
                                                        id="reward"
                                                        name="reward"
                                                        className={cn((form.errors as any)[`rules.${rule.id}.reward`] && 'border-destructive')}
                                                        placeholder={t('e.g., 200')}
                                                        value={rule.reward}
                                                        type="number"
                                                        onChange={(e) => updateRule(rule.id, 'reward', e.target.value)}
                                                    />
                                                </FormField>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
