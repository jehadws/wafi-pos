import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FilePicker } from './file-picker';
import { useTranslation } from '@/lib/i18n';
import type { GeneralSettingsPayload, GeneralSettingsOptions } from './types';

interface IdentificationTabProps {
    form: {
        data: GeneralSettingsPayload;
        setData: (field: string, value: any) => void;
    };
    options: GeneralSettingsOptions;
}

export function IdentificationTab({ form, options }: IdentificationTabProps) {
    const { t } = useTranslation();

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FormField label={t('Store Name')} description={t('The name to identify your store.')} required>
                <Input
                    value={form.data.identification.ns_store_name ?? ''}
                    onChange={(e) => form.setData('identification.ns_store_name', e.target.value)}
                />
            </FormField>

            <FormField label={t('Store Address')} description={t('The actual store address.')}>
                <Input
                    value={form.data.identification.ns_store_address ?? ''}
                    onChange={(e) => form.setData('identification.ns_store_address', e.target.value)}
                />
            </FormField>

            <FormField label={t('Store City')} description={t('The actual store city.')}>
                <Input
                    value={form.data.identification.ns_store_city ?? ''}
                    onChange={(e) => form.setData('identification.ns_store_city', e.target.value)}
                />
            </FormField>

            <FormField label={t('Store Phone')} description={t('The phone number to reach the store.')}>
                <Input
                    value={form.data.identification.ns_store_phone ?? ''}
                    onChange={(e) => form.setData('identification.ns_store_phone', e.target.value)}
                />
            </FormField>

            <FormField label={t('Store Email')} description={t('The store email. Might be used on invoices or reports.')}>
                <Input
                    type="email"
                    value={form.data.identification.ns_store_email ?? ''}
                    onChange={(e) => form.setData('identification.ns_store_email', e.target.value)}
                />
            </FormField>

            <FormField label={t('PO Box')} description={t('The store mail box number.')}>
                <Input
                    value={form.data.identification.ns_store_pobox ?? ''}
                    onChange={(e) => form.setData('identification.ns_store_pobox', e.target.value)}
                />
            </FormField>

            <FormField label={t('Store Fax')} description={t('The store fax number.')}>
                <Input
                    value={form.data.identification.ns_store_fax ?? ''}
                    onChange={(e) => form.setData('identification.ns_store_fax', e.target.value)}
                />
            </FormField>

            <div className="lg:col-span-2">
                <FormField label={t('Store Additional Information')} description={t('Store additional information.')}>
                    <Textarea
                        rows={5}
                        value={form.data.identification.ns_store_additional ?? ''}
                        onChange={(e) => form.setData('identification.ns_store_additional', e.target.value)}
                    />
                </FormField>
            </div>

            <FormField label={t('Store Square Logo')} description={t('Choose the square logo for the store.')}>
                <FilePicker
                    value={form.data.identification.ns_store_square_logo}
                    onChange={(v) => form.setData('identification.ns_store_square_logo', v)}
                    placeholder={t('Paste an image URL or pick a file')}
                />
            </FormField>

            <FormField label={t('Store Rectangle Logo')} description={t('Choose the rectangle logo for the store.')}>
                <FilePicker
                    value={form.data.identification.ns_store_rectangle_logo}
                    onChange={(v) => form.setData('identification.ns_store_rectangle_logo', v)}
                    placeholder={t('Paste an image URL or pick a file')}
                />
            </FormField>

            <FormField label={t('Language')} description={t('Define the default fallback language.')}>
                <Select
                    value={form.data.identification.ns_store_language ?? 'en'}
                    onValueChange={(v) => form.setData('identification.ns_store_language', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Language')} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.ns_store_language.map((l) => (
                            <SelectItem key={l.value} value={l.value.toString()}>
                                {l.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label={t('Theme')} description={t('Define the default theme.')}>
                <Select
                    value={form.data.identification.ns_default_theme ?? ''}
                    onValueChange={(v) => form.setData('identification.ns_default_theme', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Choose an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.ns_default_theme.map((t) => (
                            <SelectItem key={t.value} value={t.value.toString()}>
                                {t.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>
        </div>
    );
}
