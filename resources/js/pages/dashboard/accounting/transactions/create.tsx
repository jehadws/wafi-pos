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
import { Head, useForm } from '@inertiajs/react';
import { DialogTitle } from '@radix-ui/react-dialog';
import { transactionsApi } from '@/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function CreateProductPage({ infoMessage }: { infoMessage?: string }) {
    const { t } = useTranslation();

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
            account_id: '',
            value: '',
            description: '',
            recurring: false,
            type: '',
            occurrence: '',
            occurrence_value: 0,
        },
    });

    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<{ label: string; value: number }[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [configurations, setConfigurations] = useState({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) {
            return;
        }
        form.post('/api/crud/ns.transactions', {
            preserveScroll: true,
            onError: (errors) => {
                form.clearErrors();
                for (const key in errors) {
                    const flatKey = key.replace(/\./g, '_') as keyof typeof form.data;
                    if (flatKey in form.data) {
                        form.setError(flatKey, errors[key]);
                    }
                }
                toast.error(t('Please fix the validation errors'));
                console.error('Validation errors:', errors);
            },
            onSuccess: () => {
                toast.success(t('Successfully saved'));
            },
        });
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
            const data = await transactionsApi.getConfigurations();
            setConfigurations(data);
            setAccounts(data.configurations[0].fields.find((field) => field.name === 'account_id').options);
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
                        form={form}
                    />

                    <div className="bg-accent/30 border-primary border-l border-l-3 p-2">{infoMessage}</div>

                    {loading && (
                        <div className="flex h-64 items-center justify-center">
                            <div className="flex items-center justify-center">
                                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                            </div>
                        </div>
                    )}

                    {form.data.general.type === 'ns.direct-transaction' && !loading && !showModal && (
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

                            <FormField label={t('Description')} htmlFor="general_description" error={form.errors?.['general.description'] || ''}>
                                <Select
                                    value={form.data.general.account_id}
                                    onValueChange={(value) => {
                                        form.setData('general.account_id', value);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('Select an option')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts?.map((category) => (
                                            <SelectItem key={category.value} value={category.value.toString()}>
                                                {category.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                <DialogTitle className="text-left">{t('Expense Type')}</DialogTitle>
                            </div>
                        </div>
                        <DialogDescription className="sr-only mt-2 text-left"></DialogDescription>
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
                        {configurations?.configurations?.map((configuration) => (
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
