import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { extractValidationErrors } from '@/utils/api-errors';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { transactionsApi } from '@/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Transaction {
    id: number;
    name: string;
    type: string;
    active: number;
    account_id: number | string;
    value: string | number;
    description: string;
    recurring: boolean;
    occurrence: string;
    occurrence_value: number;
}

interface EditTransactionProps {
    transaction: Transaction;
    infoMessage?: string;
}

export default function EditTransactionPage() {
    const { t } = useTranslation();
    const { transaction, infoMessage } = usePage<Record<string, unknown> & EditTransactionProps>().props;

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Accounting'), href: '/dashboard/accounting' },
        { title: t('Transactions'), href: '/dashboard/accounting/transactions' },
        { title: t('Edit Transaction'), href: '#' },
    ];

    const form = useForm({
        name: transaction.name ?? '',
        general: {
            active: transaction.active ?? 0,
            account_id: transaction.account_id?.toString() ?? '',
            value: transaction.value?.toString() ?? '',
            description: transaction.description ?? '',
            recurring: transaction.recurring ?? false,
            type: transaction.type ?? '',
            occurrence: transaction.occurrence ?? '',
            occurrence_value: transaction.occurrence_value ?? 0,
        },
    });

    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<{ label: string; value: number }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const res = await transactionsApi.update(transaction.id, { ...form.data });
            toast.success(t('Transaction updated successfully'));
            if (res?.redirect) router.visit(res.redirect);
        } catch (err) {
            const errors = extractValidationErrors(err);
            form.clearErrors();
            for (const key in errors) {
                const flatKey = key.replace(/\./g, '_') as keyof typeof form.data;
                if (flatKey in form.data) {
                    form.setError(flatKey, errors[key]);
                }
            }
            toast.error(t('Please fix the validation errors'));
            console.error('Validation errors:', errors);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSubAccounts = async () => {
        setLoading(true);
        try {
            const data = await transactionsApi.getConfigurations();
            setAccounts(data.configurations[0].fields.find((field: any) => field.name === 'account_id').options);
        } catch (error) {
            console.error('Error fetching sub accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getSubAccounts();
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Edit Transaction')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Edit Transaction')}
                        description={t('Set direct, scheduled transactions.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={{ ...form, processing: isSubmitting || form.processing }}
                    />

                    {infoMessage && (
                        <div className="bg-accent/30 border-primary border-l border-l-3 p-2">{infoMessage}</div>
                    )}

                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField label={t('Name')} error={form.errors.name} description={t('Provide a name to the resource.')} required>
                                <Input
                                    id="name"
                                    name="name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    className={cn(form.errors.name && 'border-destructive')}
                                />
                            </FormField>

                            <FormField
                                label={t('Activated')}
                                description={t('If set to yes, the transaction will take effect immediately and be saved on the history.')}
                                required
                            >
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={(form.data.general.active ?? 0) === 1 ? 'default' : 'outline'}
                                        onClick={() => form.setData('general.active', 1)}
                                    >
                                        {t('Yes')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={(form.data.general.active ?? 0) === 0 ? 'default' : 'outline'}
                                        onClick={() => form.setData('general.active', 0)}
                                    >
                                        {t('No')}
                                    </Button>
                                </div>
                            </FormField>

                            <FormField label={t('Account')} htmlFor="general_account_id" error={form.errors?.['general.account_id'] || ''}>
                                <Select
                                    value={form.data.general.account_id}
                                    onValueChange={(value) => form.setData('general.account_id', value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('Select an option')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts?.map((account) => (
                                            <SelectItem key={account.value} value={account.value.toString()}>
                                                {account.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>

                            <FormField
                                label={t('Value')}
                                htmlFor="general_value"
                                description={t('Set the value of the transaction.')}
                                error={form.errors?.['general.value']}
                                required
                            >
                                <Input
                                    id="general_value"
                                    name="general_value"
                                    value={form.data.general.value}
                                    onChange={(e) => form.setData('general.value', e.target.value)}
                                    type="number"
                                    className={form.errors?.['general.value'] ? 'border-destructive' : ''}
                                />
                            </FormField>

                            <FormField label={t('Description')} htmlFor="general_description" error={form.errors?.['general.description'] || ''}>
                                <Textarea
                                    id="general_description"
                                    name="general_description"
                                    value={form.data.general.description}
                                    onChange={(e) => form.setData('general.description', e.target.value)}
                                    className={form.errors?.['general.description'] ? 'border-destructive' : ''}
                                />
                            </FormField>
                        </div>
                    )}
                </div>
            </form>
        </AppLayout>
    );
}
