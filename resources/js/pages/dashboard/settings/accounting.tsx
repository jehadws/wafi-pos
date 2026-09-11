import { settingsApi, transactionsApi } from '@/api';
import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import { SbCrudForm } from '@/components/forms/config-form/sb-crud-form';
import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { MultiSelector } from '@/components/ui/multi-selector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { FormFieldDef } from '@/types/forms';
import { useForm, usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, Loader2, Save } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

type General = {
  sb_accounting_default_paid_expense_offset_account: string | null;
  sb_accounting_expenses_accounts: number[] | null;
};

type Orders = {
  sb_accounting_orders_revenues_account: string | null;
  sb_accounting_orders_cash_account: string | null;
  sb_accounting_orders_unpaid_account: string | null;
  sb_accounting_orders_cogs_account: string | null;
};

type Payload = {
  general: General;
  orders: Orders;
};

type AccountingPayload = General & Partial<Orders>;

type Option = {
  label: string;
  value: string | number;
};

type Options = {
  sb_accounting_default_paid_expense_offset_account: Option[];
  sb_accounting_expenses_accounts: Option[];
  sb_accounting_orders_revenues_account?: Option[];
  sb_accounting_orders_cash_account?: Option[];
  sb_accounting_orders_unpaid_account?: Option[];
  sb_accounting_orders_cogs_account?: Option[];
};

export default function SettingsGeneral() {
  const { options, payload } = usePage<{ options: Options; payload: AccountingPayload }>().props;
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [open] = useState(false);
  const [isPending, startTransition] = useTransition();

  const revenuesAccountField: FormFieldDef = {
    name: 'sb_accounting_orders_revenues_account',
    label: t('Sales Revenues Account'),
    type: 'search-select',
    component: 'sbCrudForm',
    namespace: 'sb.transactions-accounts',
    options: (options.sb_accounting_orders_revenues_account || []).map((o) => ({ label: o.label, value: o.value })),
    description: t('Every order cash payment will be reflected on this account'),
  };

  const cashAccountField: FormFieldDef = {
    name: 'sb_accounting_orders_cash_account',
    label: t('Order Cash Account'),
    type: 'search-select',
    component: 'sbCrudForm',
    namespace: 'sb.transactions-accounts',
    options: (options.sb_accounting_orders_cash_account || []).map((o) => ({ label: o.label, value: o.value })),
    description: t('Every order cash payment will be reflected on this account'),
  };

  const unpaidAccountField: FormFieldDef = {
    name: 'sb_accounting_orders_unpaid_account',
    label: t('Receivable Account'),
    type: 'search-select',
    component: 'sbCrudForm',
    namespace: 'sb.transactions-accounts',
    options: (options.sb_accounting_orders_unpaid_account || []).map((o) => ({ label: o.label, value: o.value })),
    description: t('Every unpaid orders will be recorded on this account.'),
  };

  const cogsAccountField: FormFieldDef = {
    name: 'sb_accounting_orders_cogs_account',
    label: t('COGS Account'),
    type: 'search-select',
    component: 'sbCrudForm',
    namespace: 'sb.transactions-accounts',
    options: (options.sb_accounting_orders_cogs_account || []).map((o) => ({ label: o.label, value: o.value })),
    description: t('Cost of goods sold account'),
  };

  const form = useForm<Payload>({
    general: {
      sb_accounting_default_paid_expense_offset_account: payload.sb_accounting_default_paid_expense_offset_account ?? null,
      sb_accounting_expenses_accounts: payload.sb_accounting_expenses_accounts ?? null,
    },
    orders: {
      sb_accounting_orders_revenues_account: payload.sb_accounting_orders_revenues_account ?? null,
      sb_accounting_orders_cash_account: payload.sb_accounting_orders_cash_account ?? null,
      sb_accounting_orders_unpaid_account: payload.sb_accounting_orders_unpaid_account ?? null,
      sb_accounting_orders_cogs_account: payload.sb_accounting_orders_cogs_account ?? null,
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
                  label={t('Expense Accounts')}
                  description={t('Assign accounts that are likely to be used for creating direct, scheduled or recurring expenses.')}
                >
                  <MultiSelector
                    options={options.sb_accounting_expenses_accounts.map((tz) => ({ name: t(tz.label), id: +tz.value }))}
                    value={form.data.general.sb_accounting_expenses_accounts || []}
                    onChange={(value) => form.setData('general.sb_accounting_expenses_accounts', value)}
                    placeholder={t('Select roles...')}
                    searchPlaceholder={t('Search roles...')}
                    emptyText={t('No Roles found')}
                  />
                </FormField>
                <FormField
                  label={t('Paid Expense Offset')}
                  description={t('Assign the default account to be used as an offset account for paid expenses transactions.')}
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                        {form.data.general.sb_accounting_default_paid_expense_offset_account
                          ? t(
                              options.sb_accounting_default_paid_expense_offset_account.find(
                                (tz) => tz.value === +(form.data.general.sb_accounting_default_paid_expense_offset_account ?? 0),
                              )?.label ?? '',
                            )
                          : t('Select default...')}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder={t('Search') + '...'} className="h-9" />
                        <CommandList>
                          <CommandEmpty>{t('No result to display.')}</CommandEmpty>
                          <CommandGroup>
                            {options.sb_accounting_default_paid_expense_offset_account.map((tz) => (
                              <CommandItem
                                key={tz.value}
                                value={tz.value.toString()}
                                onSelect={(currentValue) => {
                                  form.setData('general.sb_accounting_default_paid_expense_offset_account', currentValue);
                                }}
                              >
                                {t(tz.label)}
                                <Check
                                  className={cn(
                                    'ms-auto',
                                    form.data.general.sb_accounting_default_paid_expense_offset_account === tz.value ? 'opacity-100' : 'opacity-0',
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

              <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-semibold">{t('Orders Accounting')}</h2>
                <p className="text-muted-foreground text-sm">{t('Define the accounts associated with orders transactions.')}</p>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  <FormField label={t('Sales Revenues Account')} description={t('Every order cash payment will be reflected on this account')}>
                    <SbCrudForm
                      field={revenuesAccountField}
                      value={form.data.orders.sb_accounting_orders_revenues_account ?? ''}
                      onChange={(value) => form.setData('orders.sb_accounting_orders_revenues_account', value ? value.toString() : '')}
                    />
                  </FormField>
                  <FormField label={t('Order Cash Account')} description={t('Every order cash payment will be reflected on this account')}>
                    <SbCrudForm
                      field={cashAccountField}
                      value={form.data.orders.sb_accounting_orders_cash_account ?? ''}
                      onChange={(value) => form.setData('orders.sb_accounting_orders_cash_account', value ? value.toString() : '')}
                    />
                  </FormField>
                  <FormField label={t('Receivable Account')} description={t('Every unpaid orders will be recorded on this account.')}>
                    <SbCrudForm
                      field={unpaidAccountField}
                      value={form.data.orders.sb_accounting_orders_unpaid_account ?? ''}
                      onChange={(value) => form.setData('orders.sb_accounting_orders_unpaid_account', value ? value.toString() : '')}
                    />
                  </FormField>
                  <FormField label={t('COGS Account')} description={t('Cost of goods sold account')}>
                    <SbCrudForm
                      field={cogsAccountField}
                      value={form.data.orders.sb_accounting_orders_cogs_account ?? ''}
                      onChange={(value) => form.setData('orders.sb_accounting_orders_cogs_account', value ? value.toString() : '')}
                    />
                  </FormField>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-b-xl border-t p-3">
              <Button onClick={() => setIsOpen(true)} disabled={isPending} variant="destructive">
                {isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                {t('Reset Default')}
              </Button>
              <Button onClick={() => handleSave()} disabled={isPending}>
                {isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
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
