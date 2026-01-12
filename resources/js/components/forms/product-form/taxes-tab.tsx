'use client';

import FormField from '@/components/forms/shared/form-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { usePage } from '@inertiajs/react';
import type { ProductFormData, TaxesTabProps } from './types';

export default function TaxesTab({ form, handleInputChange }: TaxesTabProps) {
    const { t } = useTranslation();
    const { taxes } = usePage<{ taxes: { id: number; name: string }[] }>().props;
    const handleChange = (name: keyof ProductFormData, value: string | number | number[]) => {
        handleInputChange(name, value);

        if (form.errors[name]) form.clearErrors(name);
        if (form.errors.units_error) form.clearErrors('units_error');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Tax Settings')}</CardTitle>
                <CardDescription>{t('Configure tax settings for this product')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                    label={t('Tax Group')}
                    description={t('Select the tax group that applies to the product/variation.')}
                    htmlFor="tax_group_id"
                    error={form.errors?.taxes_tax_group_id}
                >
                    <Select
                        value={form.data.taxes_tax_group_id?.toString()}
                        onValueChange={(value) => handleChange('taxes_tax_group_id', value)}
                        defaultValue="Select Tax Group"
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('Select Tax Group')} defaultValue={'Select Tax Group'} />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                            {taxes.map((tax) => (
                                <SelectItem key={tax.id} value={tax.id.toString()}>
                                    {tax.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField label={t('Tax Type')} htmlFor="taxes_tax_type" error={form.errors.taxes_tax_type}>
                    <Select
                        value={form.data.taxes_tax_type}
                        onValueChange={(value: 'inclusive' | 'exclusive') => handleChange('taxes_tax_type', value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="inclusive">{t('Inclusive')}</SelectItem>
                            <SelectItem value="exclusive">{t('Exclusive')}</SelectItem>
                        </SelectContent>
                    </Select>
                </FormField>
            </CardContent>
        </Card>
    );
}
