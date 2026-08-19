import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { useForm, usePage } from '@inertiajs/react';
import { settingsApi } from '@/api';
import { Loader2, Save } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

type General = {
    ns_orders_code_type: string | null;
    ns_orders_allow_unpaid: string | null;
    ns_orders_allow_partial: string | null;
    ns_orders_strict_instalments: string | null;
    ns_orders_quotation_expiration: string | null;
};

type Payload = {
    general: General;
};

type Option = {
    label: string;
    value: string | number;
};

type Options = {
    ns_orders_code_type: Option[];
    ns_orders_allow_unpaid: Option[];
    ns_orders_allow_partial: Option[];
    ns_orders_strict_instalments: Option[];
    ns_orders_quotation_expiration: Option[];
};

export default function SettingsGeneral() {
    const { options, payload } = usePage<{ options: Options; payload: General }>().props;
    const [isPending, startTransition] = useTransition();
    const { t } = useTranslation();

    const form = useForm<Payload>({
        general: {
            ...payload,
        },
    });

    const handleSave = () => {
        startTransition(async () => {
            try {
                const data = {
                    general: {
                        ...form.data.general,
                        ns_orders_code_type: form.data.general.ns_orders_code_type === 'null' ? null : form.data.general.ns_orders_code_type,
                        ns_orders_quotation_expiration:
                            form.data.general.ns_orders_quotation_expiration === 'null' ? null : form.data.general.ns_orders_quotation_expiration,
                    },
                };
                await settingsApi.update('orders', data);
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
                            <h1 className="text-2xl font-semibold">{t('Orders Settings')}</h1>
                            <p className="text-muted-foreground text-sm">{t('Configure settings that applies to orders.')}</p>
                            <div className="mt-4"></div>

                            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <FormField label={t('Enable Reward')} description={t('Will activate the reward system for the customers.')}>
                                    <Select
                                        value={form.data.general.ns_orders_code_type || ''}
                                        onValueChange={(v) => form.setData('general.ns_orders_code_type', v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('Select an option')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem key={'null'} value={'null'}>
                                                {t('Select an option')}
                                            </SelectItem>
                                            {options.ns_orders_code_type.map((l) => (
                                                <SelectItem key={l.value} value={l.value.toString()}>
                                                    {l.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>
                                <FormField
                                    label={t('Allow Unpaid Orders')}
                                    description={t(
                                        "Will prevent incomplete orders to be placed. If credit is allowed, this option should be set to 'yes'.",
                                    )}
                                >
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={(form.data.general.ns_orders_allow_unpaid ?? 'yes') === 'yes' ? 'default' : 'outline'}
                                            onClick={() => form.setData('general.ns_orders_allow_unpaid', 'yes')}
                                        >
                                            {t('Yes')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={(form.data.general.ns_orders_allow_unpaid ?? 'yes') === 'no' ? 'default' : 'outline'}
                                            onClick={() => form.setData('general.ns_orders_allow_unpaid', 'no')}
                                        >
                                            {t('No')}
                                        </Button>
                                    </div>
                                </FormField>
                                <FormField label={t('Allow Partial Orders')} description={t('Will prevent partially paid orders to be placed.')}>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={(form.data.general.ns_orders_allow_partial ?? 'yes') === 'yes' ? 'default' : 'outline'}
                                            onClick={() => form.setData('general.ns_orders_allow_partial', 'yes')}
                                        >
                                            {t('Yes')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={(form.data.general.ns_orders_allow_partial ?? 'yes') === 'no' ? 'default' : 'outline'}
                                            onClick={() => form.setData('general.ns_orders_allow_partial', 'no')}
                                        >
                                            {t('No')}
                                        </Button>
                                    </div>
                                </FormField>

                                <FormField label={t('Strict Instalments')} description={t('Will enforce instalment to be paid on specific date.')}>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={(form.data.general.ns_orders_strict_instalments ?? 'yes') === 'yes' ? 'default' : 'outline'}
                                            onClick={() => form.setData('general.ns_orders_strict_instalments', 'yes')}
                                        >
                                            {t('Yes')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={(form.data.general.ns_orders_strict_instalments ?? 'yes') === 'no' ? 'default' : 'outline'}
                                            onClick={() => form.setData('general.ns_orders_strict_instalments', 'no')}
                                        >
                                            {t('No')}
                                        </Button>
                                    </div>
                                </FormField>
                                <FormField
                                    label={t('Quotation Expiration')}
                                    description={t('Quotations will get deleted after they defined they has reached.')}
                                >
                                    <Select
                                        value={form.data.general.ns_orders_quotation_expiration || ''}
                                        onValueChange={(v) => form.setData('general.ns_orders_quotation_expiration', v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('Select an option')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem key={'null'} value={'null'}>
                                                {t('Select an option')}
                                            </SelectItem>
                                            {options.ns_orders_quotation_expiration.map((l) => (
                                                <SelectItem key={l.value} value={l.value.toString()}>
                                                    {l.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
