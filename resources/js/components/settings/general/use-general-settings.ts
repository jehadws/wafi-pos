import { useTransition } from 'react';
import { useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { settingsApi } from '@/api';
import { toast } from 'sonner';
import { applyTheme } from '@/hooks/use-appearance';
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
                        sb_store_language:
                            form.data.identification.sb_store_language === 'null' ? null : form.data.identification.sb_store_language,
                        sb_default_theme:
                            form.data.identification.sb_default_theme === 'null' ? null : form.data.identification.sb_default_theme,
                    },
                    currency: {
                        ...form.data.currency,
                        sb_currency_position:
                            form.data.currency.sb_currency_position === 'null' ? null : form.data.currency.sb_currency_position,
                        sb_currency_prefered:
                            form.data.currency.sb_currency_prefered === 'null' ? null : form.data.currency.sb_currency_prefered,
                        sb_currency_precision:
                            form.data.currency.sb_currency_precision === null ? null : Number(form.data.currency.sb_currency_precision),
                    },
                    date: {
                        ...form.data.date,
                        sb_date_format: form.data.date.sb_date_format === 'null' ? null : form.data.date.sb_date_format,
                        sb_datetime_format:
                            form.data.date.sb_datetime_format === 'null' ? null : form.data.date.sb_datetime_format,
                        sb_datetime_timezone:
                            form.data.date.sb_datetime_timezone === 'null' ? null : form.data.date.sb_datetime_timezone,
                    },
                    registration: {
                        ...form.data.registration,
                        sb_registration_enabled:
                            form.data.registration.sb_registration_enabled === 'null'
                                ? null
                                : form.data.registration.sb_registration_enabled,
                        sb_registration_role:
                            form.data.registration.sb_registration_role === 'null'
                                ? null
                                : form.data.registration.sb_registration_role,
                        sb_registration_validated:
                            form.data.registration.sb_registration_validated === 'null'
                                ? null
                                : form.data.registration.sb_registration_validated,
                        sb_recovery_enabled:
                            form.data.registration.sb_recovery_enabled === 'null'
                                ? null
                                : form.data.registration.sb_recovery_enabled,
                    },
                };
                await settingsApi.update('general', data);
                // Apply the default theme immediately so the admin sees
                // the change without a reload.
                const theme = data.identification.sb_default_theme;
                if (theme === 'dark' || theme === 'light') {
                    applyTheme(theme);
                }
                toast.success(t('The settings was saved successfully.'));
            } catch (e: any) {
                toast.error(e?.message || t('An unexpected error occurred.'));
            }
        });
    };

    return { form, isPending, handleSave };
}
