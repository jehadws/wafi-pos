import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateProductPage() {
    const { t } = useTranslation();
    const { category_identifiers } = usePage<{ category_identifiers: { label: string; value: string }[] }>().props;
    const [subCategories, setSubCategories] = useState<{ label: string; value: number }[]>([]);

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Accounting'), href: '/dashboard/accounting' },
        { title: t('Accounts'), href: '/dashboard/accounting/accounts' },
        { title: t('Create Account'), href: '/dashboard/accounting/accounts/create' },
    ];
    const form = useForm({
        name: '',
        general: {
            account: '',
            category_identifier: '',
            description: '',
            sub_category_id: '',
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) {
            return;
        }

        console.log('Form data:', form.data);

        form.post('/api/crud/ns.transactions-accounts', {
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
                toast.success('Product created successfully');
            },
        });
    };

    const validateForm = () => {
        console.log('calling validtatio');
        let isValid = true;
        form.clearErrors();

        if (!form.data.name.trim()) {
            form.setError('name', t('First name is required'));
            isValid = false;
        }

        return isValid;
    };

    const getSubAccounts = async (identifier: string) => {
        setSubCategories([]);
        form.setData('general.sub_category_id', '');
        try {
            const { data } = await axios.post('/api/transactions-accounts/category-identifier', {
                exclude: 0,
                identifier,
            });
            setSubCategories(data);
            console.log('sub accounts', data);
        } catch (error) {
            console.error('Error fetching sub accounts:', error);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={'Create a new Account - JGREM'} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new Account')}
                        description={t('Register a new Account and save it.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    {/* Product Name */}
                    <FormField label="Name" error={form.errors.name} description="Provide a name to the resource." className="mb-2" required>
                        <Input
                            id="name"
                            name="name"
                            onChange={(e) => form.setData('name', e.target.value)}
                            className={cn(form.errors.name && 'border-destructive')}
                        />
                    </FormField>

                    {/* Tabs */}
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="general">General</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="mt-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <FormField
                                    label="Main Account"
                                    htmlFor="general_category_identifier"
                                    description="Select the category of this account."
                                    error={form.errors?.['general.category_identifier']}
                                    required
                                >
                                    <Select
                                        value={form.data.general.category_identifier}
                                        onValueChange={(value) => {
                                            form.setData('general.category_identifier', value);
                                            getSubAccounts(value);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select an option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="null">Select an option</SelectItem>
                                            {category_identifiers?.map((category) => (
                                                <SelectItem key={category.value} value={category.value}>
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>

                                <FormField
                                    label="Sub Account"
                                    htmlFor="general_sub_category_id"
                                    description="Assign to a sub category."
                                    error={form.errors?.['general.sub_category_id']}
                                >
                                    <Select
                                        value={form.data.general.sub_category_id}
                                        onValueChange={(value) => form.setData('general.sub_category_id', value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Not set" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subCategories?.map((category) => (
                                                <SelectItem key={category.value.toString()} value={category.value.toString()}>
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>
                                <FormField
                                    label="Account"
                                    htmlFor="general_last_name"
                                    description="Provide the accounting number for this category. If left empty, it will be generated automatically."
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
                                <FormField label="Description" htmlFor="general_description" error={form.errors?.['general.description'] || ''}>
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
