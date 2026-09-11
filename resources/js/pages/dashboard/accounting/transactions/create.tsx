import { transactionsApi } from '@/api';
import { SbCrudForm } from '@/components/forms/config-form/sb-crud-form';
import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { FormFieldDef } from '@/types/forms';
import { extractValidationErrors } from '@/utils/api-errors';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { DialogTitle } from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function CreateProductPage({ infoMessage }: { infoMessage?: string }) {
    const { t } = useTranslation();
    const { roles } = usePage<{ roles: { label: string; value: number }[] }>().props;

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Accounting'), href: '/dashboard/accounting' },
        { title: t('Transactions'), href: '/dashboard/accounting/transactions' },
        { title: t('Create New Transaction'), href: '/dashboard/accounting/transactions/create' },
    ];
    const form = useForm({
        name: '',
        general: {
            active: 0,
            group_id: '',
            account_id: '',
            value: '',
            description: '',
            recurring: false,
            type: '',
            occurrence: '',
            occurrence_value: 0,
            scheduled_date: '',
        },
    });

    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<{ label: string; value: number }[]>([]);
    const accountField: FormFieldDef = {
        name: 'account_id',
        label: t('Account'),
        type: 'search-select',
        component: 'sbCrudForm',
        namespace: 'sb.transactions-accounts',
        options: accounts,
        description: t('Assign the transaction to an account'),
    };
    const [showModal, setShowModal] = useState(false);
    const [configurations, setConfigurations] = useState<any>({});

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm() || isSubmitting) {
            return;
        }
        setIsSubmitting(true);

        try {
            const res = await transactionsApi.create({ ...form.data });
            toast.success(t('Successfully saved'));
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

    const validateForm = () => {
        let isValid = true;
        form.clearErrors();

        if (!form.data.name.trim()) {
            form.setError('name', t('Name is required'));
            isValid = false;
        }

        return isValid;
    };

    const getSubAccounts = async () => {
        setLoading(true);
        try {
            const data: any = await transactionsApi.getConfigurations();
            setConfigurations(data);
            setAccounts(data.configurations[0].fields.find((field: any) => field.name === 'account_id').options);
        } catch (error) {
            console.error('Error fetching sub accounts:', error);
        } finally {
            setLoading(false);
            setShowModal(true);
        }
    };

    const handleSelectType = (type: string) => {
        form.setData('general.type', type);
        setShowModal(false);
    };

    useEffect(() => {
        getSubAccounts();
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create New Transaction')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create New Transaction')}
                        description={t('Set direct, scheduled transactions.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={{ ...form, processing: isSubmitting || form.processing }}
                    />

                    <div className="bg-accent/30 border-primary border-l border-l-3 p-2">{infoMessage}</div>

                    {loading && (
                        <div className="flex h-64 items-center justify-center">
                            <div className="flex items-center justify-center">
                                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                            </div>
                        </div>
                    )}

                    {form.data.general.type === 'sb.direct-transaction' && !loading && !showModal && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField label={t('Name')} error={form.errors.name} description={t('Provide a name to the resource.')} required>
                                <Input
                                    id="name"
                                    name="name"
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
                                <SbCrudForm
                                    field={accountField}
                                    value={form.data.general.account_id}
                                    onChange={(value) => form.setData('general.account_id', value as string)}
                                    error={form.errors?.['general.account_id']}
                                    id="general_account_id"
                                />
                            </FormField>

                            <FormField
                                label={t('Users Group')}
                                htmlFor="general_group_id"
                                description={t(
                                    'Assign transaction to users group. the Transaction will therefore be multiplied by the number of entity.',
                                )}
                                error={form.errors?.['general.group_id']}
                            >
                                <Select
                                    value={form.data.general.group_id === '' ? '0' : form.data.general.group_id}
                                    onValueChange={(value) => form.setData('general.group_id', value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('Select an option')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">{t('None')}</SelectItem>
                                        {(roles ?? []).map((role) => (
                                            <SelectItem key={role.value} value={String(role.value)}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>

                            <FormField
                                label={t('Scheduled')}
                                htmlFor="general_scheduled_date"
                                description={t('Set the scheduled date.')}
                                error={form.errors?.['general.scheduled_date']}
                            >
                                <Input
                                    id="general_scheduled_date"
                                    name="general_scheduled_date"
                                    value={form.data.general.scheduled_date}
                                    onChange={(e) => form.setData('general.scheduled_date', e.target.value)}
                                    type="datetime-local"
                                />
                            </FormField>

                            <FormField
                                label={t('Value')}
                                htmlFor="general_value"
                                description={t('set the value of the transaction.')}
                                error={form.errors?.['general.value']}
                                required
                            >
                                <Input
                                    id="general_value"
                                    name="general_value"
                                    value={form.data.general.value}
                                    onChange={(e) => form.setData('general.value', e.target.value)}
                                    type="number"
                                    className={form.errors?.['general.value'] ? 'border-red-500' : ''}
                                />
                            </FormField>
                            <FormField label={t('Description')} htmlFor="general_description" error={form.errors?.['general.description'] || ''}>
                                <Textarea
                                    id="general_description"
                                    name="general_description"
                                    value={form.data.general.description}
                                    onChange={(e) => form.setData('general.description', e.target.value)}
                                    className={form.errors?.['general.description'] ? 'border-red-500' : ''}
                                />
                            </FormField>
                        </div>
                    )}
                </div>
            </form>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <DialogTitle className="text-start">{t('Expense Type')}</DialogTitle>
                            </div>
                        </div>
                        <DialogDescription className="sr-only mt-2 text-start"></DialogDescription>
                    </DialogHeader>
                    <div>
                        {configurations?.warningMessage && (
                            <div
                                dangerouslySetInnerHTML={{ __html: configurations?.warningMessage }}
                                className="bg-accent/30 border-primary border-l border-l-3 p-2"
                            ></div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {configurations?.configurations?.map((configuration: any) => (
                            <div
                                onClick={() => handleSelectType(configuration.identifier)}
                                className="hover:bg-muted flex flex-col items-center justify-center gap-3 rounded py-2"
                                key={configuration.identifier}
                            >
                                <img src={configuration.icon} className="h-12 w-12" />
                                <p>{configuration.label}</p>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
