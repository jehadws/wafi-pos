import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { useForm, usePage } from '@inertiajs/react';
import { settingsApi } from '@/api';
import { Loader2, Save } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

type General = {
    ns_reports_email: string | null;
};

type Payload = {
    general: General;
};

type Option = {
    label: string;
    value: string | number;
};

type Options = {
    ns_reports_email: Option[];
};

export default function SettingsGeneral() {
    const { t } = useTranslation();
    const { payload } = usePage<{ options: Options; payload: General }>().props;
    const [isPending, startTransition] = useTransition();

    const form = useForm<Payload>({
        general: {
            ...payload,
        },
    });

    const handleSave = () => {
        startTransition(async () => {
            try {
                await settingsApi.update('reports', form.data);
                toast(t('Settings saved'), { description: t('The settings was saved successfully.') });
            } catch (e: any) {
                toast(t('Failed to save'), {
                    description: e?.message || t('An unexpected error occurred.'),
                });
            }
        });
    };
    return (
        <AppLayout>
            <div className="p-6">
                <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-xl border">
                        <div className="relative p-6 md:p-8">
                            <h1 className="text-2xl font-semibold">{t('Report Settings')}</h1>
                            <p className="text-muted-foreground text-sm">{t('Configure the settings')}</p>
                            <div className="mt-4"></div>

                            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                                <FormField label={t('Enable Email Reporting')} description="Determine if the reporting should be enabled globally.">
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={(form.data.general.ns_reports_email ?? 'no') === 'yes' ? 'default' : 'outline'}
                                            onClick={() => form.setData('general.ns_reports_email', 'yes')}
                                        >
                                            {t('Yes')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={(form.data.general.ns_reports_email ?? 'no') === 'no' ? 'default' : 'outline'}
                                            onClick={() => form.setData('general.ns_reports_email', 'no')}
                                        >
                                            {t('No')}
                                        </Button>
                                    </div>
                                </FormField>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-end rounded-b-xl border-t p-3">
                            <Button onClick={() => handleSave()} disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {t('Save Settings')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
