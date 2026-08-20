import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import type { GeneralSettingsPayload, GeneralSettingsOptions } from './types';

interface RegistrationTabProps {
    form: {
        data: GeneralSettingsPayload;
        setData: (field: string, value: any) => void;
    };
    options: GeneralSettingsOptions;
}

export function RegistrationTab({ form, options }: RegistrationTabProps) {
    const { t } = useTranslation();

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FormField label={t('Registration Open')} description={t('Determine if everyone can register.')}>
                <Select
                    value={form.data.registration.ns_registration_enabled ?? 'no'}
                    onValueChange={(v) => form.setData('registration.ns_registration_enabled', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Choose an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="yes">{t('Yes')}</SelectItem>
                        <SelectItem value="no">{t('No')}</SelectItem>
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label={t('Registration Role')} description={t('Select the registration role.')}>
                <Select
                    value={form.data.registration.ns_registration_role ?? ''}
                    onValueChange={(v) => form.setData('registration.ns_registration_role', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Choose an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.ns_registration_role.map((r) => (
                            <SelectItem key={r.value} value={r.value.toString()}>
                                {r.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label={t('Requires Validation')} description={t('Force account validation after registration.')}>
                <Select
                    value={form.data.registration.ns_registration_validated ?? ''}
                    onValueChange={(v) => form.setData('registration.ns_registration_validated', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Choose an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="yes">{t('Yes')}</SelectItem>
                        <SelectItem value="no">{t('No')}</SelectItem>
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label={t('Allow Recovery')} description={t('Allow any user to recover their account.')}>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={(form.data.registration.ns_recovery_enabled ?? 'yes') === 'yes' ? 'default' : 'outline'}
                        onClick={() => form.setData('registration.ns_recovery_enabled', 'yes')}
                    >
                        {t('Yes')}
                    </Button>
                    <Button
                        type="button"
                        variant={(form.data.registration.ns_recovery_enabled ?? 'yes') === 'no' ? 'default' : 'outline'}
                        onClick={() => form.setData('registration.ns_recovery_enabled', 'no')}
                    >
                        {t('No')}
                    </Button>
                </div>
            </FormField>
        </div>
    );
}
