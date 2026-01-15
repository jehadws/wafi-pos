import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';

export default function CreateProductPage() {
    const { t } = useTranslation();
    const { groups, customer } = usePage<{ groups: { id: number; name: string }[]; customer: Customer }>().props;
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Customers'), href: '/dashboard/customers' },
        { title: t('Edit customer'), href: '/dashboard/customers/edit' },
    ];
    const form = useForm({
        first_name: customer.first_name,
        general_last_name: customer.last_name || '',
        general_credit_limit_amount: customer.credit_limit_amount || '',
        general_group_id: customer.group_id || '',
        general_birth_date: customer.birth_date || '',
        general_email: customer.email || '',
        general_phone: customer.phone || '',
        general_pobox: customer.pobox || '',
        general_gender: customer.gender || '',
        billing_first_name: customer.billing.first_name || '',
        billing_last_name: customer.billing.last_name || '',
        billing_phone: customer.billing.phone || '',
        billing_address_1: customer.billing.address_1 || '',
        billing_address_2: customer.billing.address_2 || '',
        billing_country: customer.billing.country || '',
        billing_city: customer.billing.city || '',
        billing_pobox: customer.billing.pobox || '',
        billing_company: customer.billing.company || '',
        billing_email: customer.billing.email || '',
        shipping_first_name: customer.shipping.first_name || '',
        shipping_last_name: customer.shipping.last_name || '',
        shipping_phone: customer.shipping.phone || '',
        shipping_address_1: customer.shipping.address_1 || '',
        shipping_address_2: customer.shipping.address_2 || '',
        shipping_country: customer.shipping.country || '',
        shipping_city: customer.shipping.city || '',
        shipping_pobox: customer.shipping.pobox || '',
        shipping_company: customer.shipping.company || '',
        shipping_email: customer.shipping.email || '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        console.log('handleInputChange', e.target.name, e.target.value);
        const { name, value } = e.target;
        form.setData({ ...form.data, [name]: value });

        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSelectChange = (name: string, value: string | number) => {
        console.log('handleSelectChange', name, value);
        form.setData({ ...form.data, [name]: value });

        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        console.log('trigged');
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) {
            return;
        }

        form.transform(() => ({
            first_name: form.data.first_name,
            general: {
                last_name: form.data.general_last_name,
                credit_limit_amount: form.data.general_credit_limit_amount,
                group_id: form.data.general_group_id,
                birth_date: form.data.general_birth_date,
                email: form.data.general_email,
                phone: form.data.general_phone,
                pobox: form.data.general_pobox,
                gender: form.data.general_gender,
            },
            billing: {
                first_name: form.data.billing_first_name,
                last_name: form.data.billing_last_name,
                phone: form.data.billing_phone,
                address_1: form.data.billing_address_1,
                address_2: form.data.billing_address_2,
                country: form.data.billing_country,
                city: form.data.billing_city,
                pobox: form.data.billing_pobox,
                company: form.data.billing_company,
                email: form.data.billing_email,
            },
            shipping: {
                first_name: form.data.shipping_first_name,
                last_name: form.data.shipping_last_name,
                phone: form.data.shipping_phone,
                address_1: form.data.shipping_address_1,
                address_2: form.data.shipping_address_2,
                country: form.data.shipping_country,
                city: form.data.shipping_city,
                pobox: form.data.shipping_pobox,
                company: form.data.shipping_company,
                email: form.data.shipping_email,
            },
        }));

        console.log('Form data:', form.data);

        form.put(`/api/crud/ns.customers/${customer.id}`, {
            preserveScroll: true,
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error(t('The form is not valid. Please check it and try again'));
            },
            onSuccess: () => {
                toast.success(t('The customer has been edited.'));
            },
        });
    };

    const validateForm = () => {
        console.log('calling validtatio');
        let isValid = true;
        form.clearErrors();

        if (!form.data.first_name.trim()) {
            form.setError('first_name', t('First name is required'));
            isValid = false;
        }

        if (!form.data.general_group_id) {
            form.setError('general_group_id', t('Group is required'));
            isValid = false;
        }

        return isValid;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Edit customer')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Edit customer')}
                        description={t('Modify  Customer.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    {/* Product Name */}
                    <FormField label={t('Name')} error={form.errors.first_name} description={t('Provide a name to the resource.')} className="mb-6">
                        <Input
                            id="first_name"
                            name="first_name"
                            onChange={handleInputChange}
                            value={form.data.first_name}
                            className={cn(form.errors.first_name && 'border-destructive')}
                            placeholder={t('Enter Customer name')}
                            required
                        />
                    </FormField>

                    {/* Tabs */}
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="general">{t('General')}</TabsTrigger>

                            <TabsTrigger value="billing_address">{t('Billing Address')}</TabsTrigger>

                            <TabsTrigger value="shipping_address">{t('Shipping Address')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="mt-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <FormField
                                    label={t('Last Name')}
                                    htmlFor="general_last_name"
                                    description={t('Provide the customer last name')}
                                    error={form.errors?.general_last_name}
                                >
                                    <Input
                                        id="general_last_name"
                                        name="general_last_name"
                                        value={form.data.general_last_name}
                                        onChange={handleInputChange}
                                        className={form.errors?.general_last_name ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Credit Limit')}
                                    htmlFor="general_credit_limit_amount"
                                    description={t('Set what should be the limit of the purchase on credit.')}
                                    error={form.errors?.general_credit_limit_amount}
                                >
                                    <Input
                                        id="general_credit_limit_amount"
                                        name="general_credit_limit_amount"
                                        value={form.data.general_credit_limit_amount}
                                        onChange={handleInputChange}
                                        type="number"
                                        className={form.errors?.general_credit_limit_amount ? 'border-red-500' : ''}
                                    />
                                </FormField>
                                <FormField
                                    label={t('Group')}
                                    htmlFor="general_group_id"
                                    description={t('Assign the customer to a group.')}
                                    error={form.errors.general_group_id}
                                    required
                                >
                                    <Select
                                        value={form.data.general_group_id.toString()}
                                        onValueChange={(value) => handleSelectChange('general_group_id', value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {groups.map((group) => (
                                                <SelectItem key={group.id} value={group.id.toString()}>
                                                    {group.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>

                                <FormField
                                    label={t('Birth Date')}
                                    htmlFor="general_birth_date"
                                    description={t('Displays the customer birth date.')}
                                    error={form.errors?.general_birth_date}
                                >
                                    <DatePicker
                                        onDateChange={(value) => handleSelectChange('general_birth_date', value)}
                                        date={form.data.general_birth_date}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Email')}
                                    htmlFor="general_email"
                                    description={t('Provide the customer email.')}
                                    error={form.errors?.general_email}
                                >
                                    <Input
                                        id="general_email"
                                        name="general_email"
                                        value={form.data.general_email}
                                        onChange={handleInputChange}
                                        className={form.errors?.general_email ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Phone')}
                                    htmlFor="general_phone"
                                    description={t('Provide the customer phone number')}
                                    error={form.errors?.general_phone}
                                >
                                    <Input
                                        id="general_phone"
                                        name="general_phone"
                                        value={form.data.general_phone}
                                        onChange={handleInputChange}
                                        type="tel"
                                        className={form.errors?.general_email ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('PO Box')}
                                    htmlFor="general_pobox"
                                    description={t('Provide the customer PO.Box')}
                                    error={form.errors?.general_pobox}
                                >
                                    <Input
                                        id="general_pobox"
                                        name="general_pobox"
                                        value={form.data.general_pobox}
                                        onChange={handleInputChange}
                                        className={form.errors?.general_pobox ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Gender')}
                                    htmlFor="general_gender"
                                    description={t('Provide the customer gender')}
                                    error={form.errors?.general_gender}
                                >
                                    <Select value={form.data.general_gender} onValueChange={(value) => handleSelectChange('general_gender', value)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('N/A')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormField>
                            </div>
                        </TabsContent>
                        <TabsContent value="billing_address" className="mt-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <FormField
                                    label={t('First Name')}
                                    htmlFor="billing_first_name"
                                    description={t('Provide the billing first name.')}
                                    error={form.errors?.billing_first_name}
                                >
                                    <Input
                                        id="billing_first_name"
                                        name="billing_first_name"
                                        value={form.data.billing_first_name}
                                        onChange={handleInputChange}
                                        className={form.errors?.billing_first_name ? 'border-red-500' : ''}
                                    />
                                </FormField>
                                <FormField
                                    label={t('Last Name')}
                                    htmlFor="billing_last_name"
                                    description={t('Provide the billing last name.')}
                                    error={form.errors?.billing_last_name}
                                >
                                    <Input
                                        id="billing_last_name"
                                        name="billing_last_name"
                                        value={form.data.billing_last_name}
                                        onChange={handleInputChange}
                                        className={form.errors?.billing_last_name ? 'border-red-500' : ''}
                                    />
                                </FormField>
                                <FormField
                                    label={t('Phone')}
                                    htmlFor="billing_phone"
                                    description={t('Provide the Billing phone number.')}
                                    error={form.errors?.billing_phone}
                                >
                                    <Input
                                        id="billing_phone"
                                        name="billing_phone"
                                        value={form.data.billing_phone}
                                        onChange={handleInputChange}
                                        className={form.errors?.billing_phone ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Address 1')}
                                    htmlFor="billing_address_1"
                                    description={t('Billing First Address.')}
                                    error={form.errors?.billing_address_1}
                                >
                                    <Input
                                        id="billing_address_1"
                                        name="billing_address_1"
                                        value={form.data.billing_address_1}
                                        onChange={handleInputChange}
                                        className={form.errors?.billing_address_1 ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Address 2')}
                                    htmlFor="billing_address_2"
                                    description={t('Billing Second Address.')}
                                    error={form.errors?.billing_address_2}
                                >
                                    <Input
                                        id="billing_address_2"
                                        name="billing_address_2"
                                        value={form.data.billing_address_2}
                                        onChange={handleInputChange}
                                        className={form.errors?.billing_address_2 ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Country')}
                                    htmlFor="billing_country"
                                    description={t('Billing Country.')}
                                    error={form.errors?.billing_country}
                                >
                                    <Input
                                        id="billing_country"
                                        name="billing_country"
                                        value={form.data.billing_country}
                                        onChange={handleInputChange}
                                        className={form.errors?.billing_country ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField label={t('City')} htmlFor="billing_city" description={t('City')} error={form.errors?.billing_city}>
                                    <Input
                                        id="billing_city"
                                        name="billing_city"
                                        value={form.data.billing_city}
                                        onChange={handleInputChange}
                                        className={form.errors?.billing_city ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField label={t('PO Box')} htmlFor="billing_pobox" description={t('PO Box')} error={form.errors?.billing_pobox}>
                                    <Input
                                        id="billing_pobox"
                                        name="billing_pobox"
                                        value={form.data.billing_pobox}
                                        onChange={handleInputChange}
                                        className={form.errors?.billing_pobox ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Company')}
                                    htmlFor="billing_company"
                                    description={t('Company')}
                                    error={form.errors?.billing_company}
                                >
                                    <Input
                                        id="billing_company"
                                        name="billing_company"
                                        value={form.data.billing_company}
                                        onChange={handleInputChange}
                                        className={form.errors?.billing_company ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Email')}
                                    htmlFor="billing_email"
                                    description={t('Billing phone number.')}
                                    error={form.errors?.billing_email}
                                >
                                    <Input
                                        id="billing_email"
                                        name="billing_email"
                                        value={form.data.billing_email}
                                        onChange={handleInputChange}
                                        className={form.errors?.billing_email ? 'border-red-500' : ''}
                                    />
                                </FormField>
                            </div>
                        </TabsContent>

                        <TabsContent value="shipping_address" className="mt-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <FormField
                                    label={t('First Name')}
                                    htmlFor="shipping_first_name"
                                    description={t('Provide the shipping First Name.')}
                                    error={form.errors?.shipping_first_name}
                                >
                                    <Input
                                        id="shipping_first_name"
                                        name="shipping_first_name"
                                        value={form.data.shipping_first_name}
                                        onChange={handleInputChange}
                                        className={form.errors?.shipping_first_name ? 'border-red-500' : ''}
                                    />
                                </FormField>
                                <FormField
                                    label={t('Last Name')}
                                    htmlFor="shipping_last_name"
                                    description={t('Provide the shipping Last Name.')}
                                    error={form.errors?.shipping_last_name}
                                >
                                    <Input
                                        id="shipping_last_name"
                                        name="shipping_last_name"
                                        value={form.data.shipping_last_name}
                                        onChange={handleInputChange}
                                        className={form.errors?.shipping_last_name ? 'border-red-500' : ''}
                                    />
                                </FormField>
                                <FormField
                                    label={t('Phone')}
                                    htmlFor="shipping_phone"
                                    description={t('Shipping phone number.')}
                                    error={form.errors?.shipping_phone}
                                >
                                    <Input
                                        id="shipping_phone"
                                        name="shipping_phone"
                                        value={form.data.shipping_phone}
                                        onChange={handleInputChange}
                                        className={form.errors?.shipping_phone ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Address 1')}
                                    htmlFor="shipping_address_1"
                                    description={t('Shipping First Address.')}
                                    error={form.errors?.shipping_address_1}
                                >
                                    <Input
                                        id="shipping_address_1"
                                        name="shipping_address_1"
                                        value={form.data.shipping_address_1}
                                        onChange={handleInputChange}
                                        className={form.errors?.shipping_address_1 ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Address 2')}
                                    htmlFor="shipping_address_2"
                                    description={t('Shipping Second Address.')}
                                    error={form.errors?.shipping_address_2}
                                >
                                    <Input
                                        id="shipping_address_2"
                                        name="shipping_address_2"
                                        value={form.data.shipping_address_2}
                                        onChange={handleInputChange}
                                        className={form.errors?.shipping_address_2 ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Country')}
                                    htmlFor="shipping_country"
                                    description={t('Shipping Country.')}
                                    error={form.errors?.shipping_country}
                                >
                                    <Input
                                        id="shipping_country"
                                        name="shipping_country"
                                        value={form.data.shipping_country}
                                        onChange={handleInputChange}
                                        className={form.errors?.shipping_country ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField label={t('City')} htmlFor="shipping_city" description={t('City')} error={form.errors?.shipping_city}>
                                    <Input
                                        id="shipping_city"
                                        name="shipping_city"
                                        value={form.data.shipping_city}
                                        onChange={handleInputChange}
                                        className={form.errors?.shipping_city ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField label={t('PO Box')} htmlFor="shipping_pobox" description={t('PO Box')} error={form.errors?.shipping_pobox}>
                                    <Input
                                        id="shipping_pobox"
                                        name="shipping_pobox"
                                        value={form.data.shipping_pobox}
                                        onChange={handleInputChange}
                                        className={form.errors?.shipping_pobox ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label="Company"
                                    htmlFor="shipping_company"
                                    description="Company name."
                                    error={form.errors?.shipping_company}
                                >
                                    <Input
                                        id="shipping_company"
                                        name="shipping_company"
                                        value={form.data.shipping_company}
                                        onChange={handleInputChange}
                                        className={form.errors?.shipping_company ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label="Email"
                                    htmlFor="shipping_email"
                                    description="Provide the shipping email."
                                    error={form.errors?.shipping_email}
                                >
                                    <Input
                                        id="shipping_email"
                                        name="shipping_email"
                                        value={form.data.shipping_email}
                                        onChange={handleInputChange}
                                        className={form.errors?.shipping_email ? 'border-red-500' : ''}
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
