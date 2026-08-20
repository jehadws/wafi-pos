import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import type { PosSettingsPayload, PosSettingsOptions } from './types';

interface VatTabProps {
    form: {
        data: PosSettingsPayload;
        setData: (field: string, value: any) => void;
    };
    options: PosSettingsOptions;
}

export function VatTab({ form, options }: VatTabProps) {
    const { t } = useTranslation();

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FormField label={t('VAT Type')} description={t('Determine the VAT type that should be used.')}>
                <Select
                    value={form.data.vat.ns_jgrem_vat || ''}
                    onValueChange={(v) => form.setData('vat.ns_jgrem_vat', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Select an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem key="null" value="null">
                            {t('Select an option')}
                        </SelectItem>
                        {options.ns_jgrem_vat.map((l) => (
                            <SelectItem key={l.value} value={l.value.toString()}>
                                {l.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>
        </div>
    );
}
