import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { CustomerGroupFormData } from './use-customer-group-form';

interface CustomerGroupFormFieldsProps {
    form: {
        data: CustomerGroupFormData;
        errors: Partial<Record<keyof CustomerGroupFormData, string>>;
    };
    rewards: { id: number; name: string }[];
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSelectChange: (name: keyof CustomerGroupFormData, value: string | number) => void;
}

export function CustomerGroupFormFields({
    form,
    rewards,
    handleInputChange,
    handleSelectChange,
}: CustomerGroupFormFieldsProps) {
    const { t } = useTranslation();

    return (
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
                <Select
                    value={form.data.reward_system_id ? form.data.reward_system_id.toString() : ''}
                    onValueChange={(value) => handleSelectChange('reward_system_id', +value)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Select Reward System')} />
                    </SelectTrigger>
                    <SelectContent>
                        {rewards.map((reward) => (
                            <SelectItem key={reward.id} value={reward.id.toString()}>
                                <div className="flex items-center gap-2">{reward.name}</div>
                            </SelectItem>
                        ))}
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
    );
}
