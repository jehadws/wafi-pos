import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { MultiSelector } from '@/components/ui/multi-selector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useForm, usePage } from '@inertiajs/react';
import { settingsApi, transactionsApi } from '@/api';
import { Check, ChevronsUpDown, Loader2, Save } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

type General = {
    ns_accounting_default_paid_expense_offset_account: string | null;
    ns_accounting_expenses_accounts: number[] | null;
};

type Payload = {
    general: General;
};

type Option = {
    label: string;
    value: string | number;
};

type Options = {
    ns_accounting_default_paid_expense_offset_account: Option[];
    ns_accounting_expenses_accounts: Option[];
};

export default function SettingsGeneral() {
    const { options, payload } = usePage<{ options: Options; payload: General }>().props;
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<Payload>({
        general: {
            ...payload,
        },
    });

    const handleSave = () => {
        startTransition(async () => {
            try {
                await settingsApi.update('accounting', form.data);
                toast(t('Settings saved'), { description: t('The settings was saved successfully.') });
            } catch (e: any) {
                toast(t('Failed to save'), {
                    description: e?.message || t('An unexpected error occurred.'),
                });
            }
        });
    };

    const handleReset = async () => {
        // /api/transactions-accounts/reset-defaults
        startTransition(async () => {
            try {
                await transactionsApi.resetAccountDefaults();
                setIsOpen(false);
                toast(t('Settings saved'), { description: t('The default accounts has been created.') });
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
                            <h1 className="text-2xl font-semibold">{t('Accounting Settings')}</h1>
                            <p className="text-muted-foreground text-sm">{t('Configure the accounting feature.')}</p>
                            <div className="mt-4"></div>

                            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                                <FormField
                                    label="Expense Accounts"
                                    description="Assign accounts that are likely to be used for creating direct, scheduled or recurring expenses."
                                >
                                    <MultiSelector
                                        options={options.ns_accounting_expenses_accounts.map((tz) => ({ name: tz.label, id: +tz.value }))}
                                        value={form.data.general.ns_accounting_expenses_accounts || []}
                                        onChange={(value) => form.setData('general.ns_accounting_expenses_accounts', value)}
                                        placeholder={t('Select roles...')}
                                        searchPlaceholder={t('Search roles...')}
                                        emptyText={t('No Roles found')}
                                    />
                                </FormField>
                                <FormField
                                    label="Paid Expense Offset"
                                    description="Assign the default account to be used as an offset account for paid expenses transactions."
                                >
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                                                {form.data.general.ns_accounting_default_paid_expense_offset_account
                                                    ? options.ns_accounting_default_paid_expense_offset_account.find(
                                                          (tz) => tz.value === +form.data.general.ns_accounting_default_paid_expense_offset_account,
                                                      )?.label
                                                    : 'Select default...'}
                                                <ChevronsUpDown className="opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder={t('Search') + '...'} className="h-9" />
                                                <CommandList>
                                                    <CommandEmpty>{t('No result to display.')}</CommandEmpty>
                                                    <CommandGroup>
                                                        {options.ns_accounting_default_paid_expense_offset_account.map((tz) => (
                                                            <CommandItem
                                                                key={tz.value}
                                                                value={tz.value.toString()}
                                                                onSelect={(currentValue) => {
                                                                    form.setData(
                                                                        'general.ns_accounting_default_paid_expense_offset_account',
                                                                        +currentValue,
                                                                    );
                                                                }}
                                                            >
                                                                {tz.label}
                                                                <Check
                                                                    className={cn(
                                                                        'ml-auto',
                                                                        form.data.general.ns_accounting_default_paid_expense_offset_account ===
                                                                            tz.value
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
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between rounded-b-xl border-t p-3">
                            <Button onClick={() => setIsOpen(true)} disabled={isPending} variant="destructive">
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Reset Default
                            </Button>
                            <Button onClick={() => handleSave()} disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {t('Save Settings')}
                            </Button>
                        </div>
                    </div>

                    <ConfirmationDialog
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        onConfirm={handleReset}
                        title={t('Confirm Your Action')}
                        description={t(
                            'This will clear all records and accounts. It is ideal if you want to start from scratch. Are you sure you want to reset default settings for accounting?',
                        )}
                        confirmText={t('Yes')}
                        cancelText={t('No')}
                        variant="destructive"
                        loading={isPending}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
