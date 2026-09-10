import { transactionsApi } from '@/api';
import { crudApi } from '@/api/crud';
import { SbCrudForm } from '@/components/forms/config-form/sb-crud-form';
import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { FormFieldDef } from '@/types/forms';
import { extractValidationErrors } from '@/utils/api-errors';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TransactionAccount {
    id: number;
    name: string;
    account: string | null;
    category_identifier: string;
    sub_category_id: number | null;
    description: string | null;
}

interface EditTransactionAccountProps {
    transaction_account: TransactionAccount;
    infoMessage?: string;
}

export default function EditTransactionAccountPage() {
    const { t } = useTranslation();
    const { transaction_account, infoMessage } = usePage<Record<string, unknown> & EditTransactionAccountProps>().props;

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Accounting'), href: '/dashboard/accounting' },
        { title: t('Accounts'), href: '/dashboard/accounting/accounts' },
        { title: t('Edit Account'), href: '#' },
    ];

    const form = useForm({
        name: transaction_account.name ?? '',
        general: {
            account: transaction_account.account ?? '',
            category_identifier: transaction_account.category_identifier ?? '',
            description: transaction_account.description ?? '',
            sub_category_id: transaction_account.sub_category_id?.toString() ?? '',
        },
    });

    const [subCategories, setSubCategories] = useState<{ label: string; value: number }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const subCategoryField: FormFieldDef = {
        name: 'sub_category_id',
        label: t('Sub Account'),
        type: 'search-select',
        component: 'sbCrudForm',
        namespace: 'sb.transactions-accounts',
        options: subCategories,
        description: t('Assign to a sub category.'),
    };

    // Mirror the backend refreshConfig on sub_category_id: when the main
    // account category changes, the sub-account options reload (the
    // account itself is excluded so it cannot become its own parent).
    const getSubAccounts = async (identifier: string) => {
        setSubCategories([]);
        form.setData('general.sub_category_id', '');
        try {
            const data = await transactionsApi.getCategoryIdentifier(identifier, transaction_account.id);
            setSubCategories(data);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.warn('Error fetching sub accounts:', error);
            }
        }
    };

    useEffect(() => {
        if (transaction_account.category_identifier) {
            void getSubAccounts(transaction_account.category_identifier);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (infoMessage) {
            toast.info(infoMessage);
        }
    }, [infoMessage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm() || isSubmitting) {
            return;
        }
        setIsSubmitting(true);

        try {
            const res = await crudApi.update('sb.transactions-accounts', transaction_account.id, { ...form.data });
            toast.success(res?.message ?? t('Successfully saved'));
            if (res?.redirect) router.visit(res.redirect);
        } catch (err) {
            const errors = extractValidationErrors(err);
            for (const key in errors) {
                const flatKey = key.replace(/\./g, '_') as keyof typeof form.data;
                if (flatKey in form.data) {
                    form.setError(flatKey, errors[key]);
                }
            }
            toast.error(t('Please fix the validation errors'));
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('Edit Account')} — ${transaction_account.name}`} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Edit Account')}
                        description={t('Register a new Account and save it.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={{ ...form, processing: isSubmitting || form.processing }}
                    />

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="general">{t('General')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="mt-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <FormField
                                    label={t('Name')}
                                    htmlFor="name"
                                    description={t('Provide a name to the resource.')}
                                    error={form.errors.name}
                                    required
                                >
                                    <Input
                                        id="name"
                                        name="name"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        className={cn(form.errors.name && 'border-destructive')}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Main Account')}
                                    htmlFor="general_category_identifier"
                                    description={t('Select the category of this account.')}
                                    error={form.errors?.['general.category_identifier']}
                                    required
                                >
                                    <Select
                                        value={form.data.general.category_identifier}
                                        onValueChange={(value) => {
                                            form.setData('general.category_identifier', value);
                                            void getSubAccounts(value);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('Select an option')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="null">{t('Select an option')}</SelectItem>
                                            {(
                                                usePage<{ category_identifiers: { label: string; value: string }[] }>().props.category_identifiers ??
                                                []
                                            ).map((category) => (
                                                <SelectItem key={category.value} value={category.value}>
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>

                                <FormField
                                    label={t('Sub Account')}
                                    htmlFor="general_sub_category_id"
                                    description={t('Assign to a sub category.')}
                                    error={form.errors?.['general.sub_category_id']}
                                >
                                    <SbCrudForm
                                        field={subCategoryField}
                                        value={form.data.general.sub_category_id}
                                        onChange={(value) => form.setData('general.sub_category_id', value != null ? String(value) : '')}
                                        error={form.errors?.['general.sub_category_id']}
                                        id="general_sub_category_id"
                                    />
                                </FormField>

                                <FormField
                                    label={t('Account')}
                                    htmlFor="general_account"
                                    description={t(
                                        'Provide the accounting number for this category. If left empty, it will be generated automatically.',
                                    )}
                                    error={form.errors?.['general.account']}
                                >
                                    <Input
                                        id="general_account"
                                        name="general_account"
                                        value={form.data.general.account}
                                        onChange={(e) => form.setData('general.account', e.target.value)}
                                        className={form.errors?.['general.account'] ? 'border-red-500' : ''}
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
                        </TabsContent>
                    </Tabs>
                </div>
            </form>
        </AppLayout>
    );
}
