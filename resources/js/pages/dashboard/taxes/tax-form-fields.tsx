import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { TaxFormData } from './use-tax-form';

interface TaxFormFieldsProps {
    form: {
        data: TaxFormData;
        errors: Partial<Record<keyof TaxFormData, string>>;
    };
    groups: { id: number; name: string }[];
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSelectChange: (name: keyof TaxFormData, value: string | number) => void;
}

export function TaxFormFields({ form, groups, handleInputChange, handleSelectChange }: TaxFormFieldsProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                    label={t('Tax Group')}
                    description={t('Assign the tax to a tax group.')}
                    htmlFor="tax_group_id"
                    error={form.errors.tax_group_id}
                    required
                >
                    <Select
                        value={form.data.tax_group_id ? form.data.tax_group_id.toString() : ''}
                        onValueChange={(value) => handleSelectChange('tax_group_id', +value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {groups.map((group) => (
                                <SelectItem key={group.id} value={group.id.toString()}>
                                    <div className="flex items-center gap-2">{group.name}</div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('Rate')}
                    error={form.errors.rate}
                    required
                    description={t('Define the rate value for the tax.')}
                    className="mb-6"
                >
                    <Input
                        id="rate"
                        name="rate"
                        value={form.data.rate}
                        onChange={handleInputChange}
                        className={cn(form.errors.rate && 'border-destructive')}
                    />
                </FormField>

                <FormField
                    label={t('Description')}
                    htmlFor="description"
                    description={t('Provide a description to the tax.')}
                    error={form.errors?.description}
                >
                    <Textarea
                        id="description"
                        name="description"
                        value={form.data.description}
                        onChange={handleInputChange}
                        placeholder={t('Description')}
                        rows={4}
                    />
                </FormField>
            </div>
        </div>
    );
}
