import { useTransition } from 'react';
import { useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { settingsApi } from '@/api';
import { toast } from 'sonner';
import type { GeneralSettingsPayload } from './types';

export function useGeneralSettings(initialSettings: GeneralSettingsPayload) {
    const { t } = useTranslation();
    const [isPending, startTransition] = useTransition();

    const form = useForm<GeneralSettingsPayload>({
        identification: { ...initialSettings.identification },
        currency: { ...initialSettings.currency },
        date: { ...initialSettings.date },
        registration: { ...initialSettings.registration },
    });

    const handleSave = () => {
        startTransition(async () => {
            try {
                const data: GeneralSettingsPayload = {
                    identification: {
                        ...form.data.identification,
                        ns_store_language:
                            form.data.identification.ns_store_language === 'null' ? null : form.data.identification.ns_store_language,
                        ns_default_theme:
                            form.data.identification.ns_default_theme === 'null' ? null : form.data.identification.ns_default_theme,
                    },
                    currency: {
                        ...form.data.currency,
                        ns_currency_position:
                            form.data.currency.ns_currency_position === 'null' ? null : form.data.currency.ns_currency_position,
                        ns_currency_prefered:
                            form.data.currency.ns_currency_prefered === 'null' ? null : form.data.currency.ns_currency_prefered,
                        ns_currency_precision:
                            form.data.currency.ns_currency_precision === null ? null : Number(form.data.currency.ns_currency_precision),
                    },
                    date: {
                        ...form.data.date,
                        ns_date_format: form.data.date.ns_date_format === 'null' ? null : form.data.date.ns_date_format,
                        ns_datetime_format:
                            form.data.date.ns_datetime_format === 'null' ? null : form.data.date.ns_datetime_format,
                        ns_datetime_timezone:
                            form.data.date.ns_datetime_timezone === 'null' ? null : form.data.date.ns_datetime_timezone,
                    },
                    registration: {
                        ...form.data.registration,
                        ns_registration_enabled:
                            form.data.registration.ns_registration_enabled === 'null'
                                ? null
                                : form.data.registration.ns_registration_enabled,
                        ns_registration_role:
                            form.data.registration.ns_registration_role === 'null'
                                ? null
                                : form.data.registration.ns_registration_role,
                        ns_registration_validated:
                            form.data.registration.ns_registration_validated === 'null'
                                ? null
                                : form.data.registration.ns_registration_validated,
                        ns_recovery_enabled:
                            form.data.registration.ns_recovery_enabled === 'null'
                                ? null
                                : form.data.registration.ns_recovery_enabled,
                    },
                };
                await settingsApi.update('general', data);
                toast.success(t('The settings was saved successfully.'));
            } catch (e: any) {
                toast.error(e?.message || t('An unexpected error occurred.'));
            }
        });
    };

    return { form, isPending, handleSave };
}
