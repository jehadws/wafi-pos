import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import type { PosSettingsPayload, PosSettingsOptions } from './types';

interface LayoutTabProps {
    form: {
        data: PosSettingsPayload;
        setData: (field: string, value: any) => void;
    };
    options: PosSettingsOptions;
}

export function LayoutTab({ form, options }: LayoutTabProps) {
    const { t } = useTranslation();

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FormField label={t('POS Layout')} description={t('Change the layout of the POS.')}>
                <Select
                    value={form.data.layout.sb_subul_layout || ''}
                    onValueChange={(v) => form.setData('layout.sb_subul_layout', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Select an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem key="null" value="null">
                            {t('Select an option')}
                        </SelectItem>
                        {options.sb_subul_layout.map((l) => (
                            <SelectItem key={l.value} value={l.value.toString() || 'null'}>
                                {l.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label={t('Sale Complete Sound')} description={t('Change the layout of the POS.')}>
                <Select
                    value={form.data.layout.sb_subul_complete_sale_audio || ''}
                    onValueChange={(v) => form.setData('layout.sb_subul_complete_sale_audio', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Select an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem key="null" value="null">
                            {t('Select an option')}
                        </SelectItem>
                        {options.sb_subul_complete_sale_audio.map((l) => (
                            <SelectItem key={l.value} value={l.value.toString() || 'null'}>
                                {l.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField
                label={t('New Item Audio')}
                description={t('The sound that plays when an item is added to the cart.')}
            >
                <Select
                    value={form.data.layout.sb_subul_new_item_audio || ''}
                    onValueChange={(v) => form.setData('layout.sb_subul_new_item_audio', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Select an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem key="null" value="null">
                            {t('Select an option')}
                        </SelectItem>
                        {options.sb_subul_new_item_audio.map((l) => (
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
