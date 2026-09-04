import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import type { GeneralSettingsPayload, GeneralSettingsOptions } from './types';

interface CurrencyTabProps {
    form: {
        data: GeneralSettingsPayload;
        setData: (field: string, value: any) => void;
    };
    options: GeneralSettingsOptions;
}

export function CurrencyTab({ form, options }: CurrencyTabProps) {
    const { t } = useTranslation();

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FormField label={t('Currency Symbol')} description={t('This is the currency symbol.')} required>
                <Input
                    value={form.data.currency.sb_currency_symbol ?? ''}
                    onChange={(e) => form.setData('currency.sb_currency_symbol', e.target.value)}
                />
            </FormField>

            <FormField label={t('Currency ISO')} description={t('The international currency ISO format.')} required>
                <Input
                    value={form.data.currency.sb_currency_iso ?? ''}
                    onChange={(e) => form.setData('currency.sb_currency_iso', e.target.value)}
                />
            </FormField>

            <FormField label={t('Currency Position')} description={t('Define where the currency should be located.')}>
                <Select
                    value={form.data.currency.sb_currency_position ?? ''}
                    onValueChange={(v) => form.setData('currency.sb_currency_position', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Choose an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.sb_currency_position.map((p) => (
                            <SelectItem key={p.value} value={p.value.toString()}>
                                {p.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label={t('Preferred Currency')} description={t('Determine which currency indicator should be used.')}>
                <Select
                    value={form.data.currency.sb_currency_prefered ?? ''}
                    onValueChange={(v) => form.setData('currency.sb_currency_prefered', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Choose an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.sb_currency_prefered.map((p) => (
                            <SelectItem key={p.value} value={p.value.toString()}>
                                {p.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField
                label={t('Currency Thousand Separator')}
                description={t('Define the symbol that indicate thousand. By default "," is used.')}
            >
                <Input
                    value={form.data.currency.sb_currency_thousand_separator ?? ''}
                    onChange={(e) => form.setData('currency.sb_currency_thousand_separator', e.target.value)}
                />
            </FormField>

            <FormField
                label={t('Currency Decimal Separator')}
                description={t('Define the symbol that indicate decimal number. By default "." is used.')}
            >
                <Input
                    value={form.data.currency.sb_currency_decimal_separator ?? ''}
                    onChange={(e) => form.setData('currency.sb_currency_decimal_separator', e.target.value)}
                />
            </FormField>

            <FormField label={t('Currency Precision')} description={t('Define how many decimals to use.')}>
                <Select
                    value={String(form.data.currency.sb_currency_precision ?? 2)}
                    onValueChange={(v) => form.setData('currency.sb_currency_precision', Number(v))}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Currency Precision')} />
                    </SelectTrigger>
                    <SelectContent>
                        {[0, 1, 2, 3, 4].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                                {n} {n === 1 ? t('number') : t('numbers')} {t('after the decimal')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>
        </div>
    );
}
