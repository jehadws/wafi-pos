import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useForm, usePage } from '@inertiajs/react';
import { settingsApi } from '@/api';
import { Check, ChevronsUpDown, Loader2, Save } from 'lucide-react';
import { useTransition, useState } from 'react';
import { toast } from 'sonner';

type General = {
    sb_customers_credit_enabled: string | null;
    sb_customers_default: string | null;
    sb_customers_default_group: string | null;
    sb_customers_force_unique_phone: string | null;
    sb_customers_force_valid_email: string | null;
    sb_customers_rewards_enabled: string | null;
};

type Payload = {
    general: General;
};

type Option = {
    label: string;
    value: string | number;
};

type Options = {
    sb_customers_credit_enabled: Option[];
    sb_customers_default: Option[];
    sb_customers_default_group: Option[];
    sb_customers_force_unique_phone: Option[];
    sb_customers_force_valid_email: Option[];
    sb_customers_rewards_enabled: Option[];
};

export default function SettingsGeneral() {
    const { options, payload } = usePage<{ options: Options; payload: General }>().props;
    const { t } = useTranslation();
    const [isPending, startTransition] = useTransition();
    const [open] = useState(false);

    const form = useForm<Payload>({
        general: {
            ...payload,
        },
    });

    const handleSave = () => {
        startTransition(async () => {
            try {
                await settingsApi.update('customers', form.data);
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
                            <h1 className="text-2xl font-semibold">{t('General Settings')}</h1>
                            <p className="text-muted-foreground text-sm">{t('Configure the general settings of the application.')}</p>
                            <div className="mt-4"></div>

                            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <FormField label={t('Enable Reward')} description={t('Will activate the reward system for the customers.')}>
                                    <Select
                                        value={form.data.general.sb_customers_rewards_enabled === 'yes' ? 'yes' : 'no'}
                                        onValueChange={(v) => form.setData('general.sb_customers_rewards_enabled', v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('Select an option')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.sb_customers_rewards_enabled.map((l) => (
                                                <SelectItem key={l.value} value={l.value.toString()}>
                                                    {l.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>
                                <FormField label={t('Require Valid Email')} description={t('Will for valid unique email for every customer.')}>
                                    <Select
                                        value={form.data.general.sb_customers_force_valid_email ?? 'no'}
                                        onValueChange={(v) => form.setData('general.sb_customers_force_valid_email', v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('Select an option')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.sb_customers_force_valid_email.map((l) => (
                                                <SelectItem key={l.value} value={l.value.toString()}>
                                                    {l.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>
                                <FormField label={t('Require Unique Phone')} description={t('Every customer should have a unique phone number.')}>
                                    <Select
                                        value={form.data.general.sb_customers_force_unique_phone ?? 'no'}
                                        onValueChange={(v) => form.setData('general.sb_customers_force_unique_phone', v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('Select an option')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.sb_customers_force_unique_phone.map((l) => (
                                                <SelectItem key={l.value} value={l.value.toString()}>
                                                    {l.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>

                                <FormField
                                    label={t('Default Customer Account')}
                                    description={t("You must create a customer to which each sales are attributed when the walking customer doesn't register.")}
                                >
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                                                {form.data.general.sb_customers_default && form.data.general.sb_customers_default !== 'no'
                                                    ? options.sb_customers_default.find(
                                                          (tz) => tz.value.toString() === form.data.general.sb_customers_default?.toString()
                                                      )?.label ?? t('Select default...')
                                                    : t('None')}
                                                <ChevronsUpDown className="opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder={t('Search') + '...'} className="h-9" />
                                                <CommandList>
                                                    <CommandEmpty>{t('No framework found.')}</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="no"
                                                            onSelect={() => {
                                                                form.setData('general.sb_customers_default', 'no');
                                                            }}
                                                        >
                                                            {t('None')}
                                                            <Check
                                                                className={cn(
                                                                    'ms-auto',
                                                                    form.data.general.sb_customers_default === 'no' || !form.data.general.sb_customers_default
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0',
                                                                )}
                                                            />
                                                        </CommandItem>
                                                        {options.sb_customers_default.map((tz) => (
                                                            <CommandItem
                                                                key={tz.value}
                                                                value={tz.value.toString()}
                                                                onSelect={(currentValue) => {
                                                                    form.setData('general.sb_customers_default', currentValue);
                                                                }}
                                                            >
                                                                {tz.label}
                                                                <Check
                                                                    className={cn(
                                                                        'ms-auto',
                                                                        form.data.general.sb_customers_default?.toString() === tz.value.toString()
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0',
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </FormField>
                                <FormField
                                    label={t('Default Customer Group')}
                                    description={t('Select to which group each new created customers are assigned to.')}
                                >
                                    <Select
                                        value={form.data.general.sb_customers_default_group?.toString() ?? 'no'}
                                        onValueChange={(v) => form.setData('general.sb_customers_default_group', v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('Select an option')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.sb_customers_default_group.map((l) => (
                                                <SelectItem key={l.value} value={l.value.toString()}>
                                                    {l.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>
                                <FormField label={t('Store P.O.Box')} description={t('The store mail box number.')}>
                                    <Select
                                        value={form.data.general.sb_customers_credit_enabled ?? 'no'}
                                        onValueChange={(v) => form.setData('general.sb_customers_credit_enabled', v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('Select an option')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.sb_customers_credit_enabled.map((l) => (
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
                                {isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                                {t('Save Settings')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
