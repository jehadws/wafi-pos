import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import ToggleButtons from '@/components/forms/shared/toggle-buttons';
import { Tabs, TabsList, TabsTrigger } from '@/components/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { MultiSelector } from '@/components/ui/multi-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CreateProductPage() {
    const { t } = useTranslation();
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Users'), href: '/dashboard/users' },
        { title: t('Edit user'), href: '/dashboard/users/edit' },
    ];
    const { groups, roles, user } = usePage<{ groups: { id: number; name: string }[]; roles: { id: number; name: string }[] }>().props;
    const form = useForm({
        username: user.username,
        general_active: user.active ? 1 : 0,
        general_birth_date: user.birth_date || '',
        general_credit_limit_amount: user.credit_limit_amount || 0,
        general_email: user.email,
        general_first_name: user.first_name || '',
        general_gender: user.gender || '',
        general_group_id: user.group_id || '',
        general_last_name: user.last_name || '',
        general_phone: user.phone || '',
        general_pobox: user.pobox || '',
        general_roles: user.roles !== null ? user.roles.map((role) => role.id) : [],
        general_password: '',
        general_password_confirm: '',
        billing_first_name: user.billing.first_name || '',
        billing_last_name: user.billing.last_name || '',
        billing_phone: user.billing.phone || '',
        billing_address_1: user.billing.address_1 || '',
        billing_address_2: user.billing.address_2 || '',
        billing_country: user.billing.country || '',
        billing_city: user.billing.city || '',
        billing_pobox: user.billing.pobox || '',
        billing_company: user.billing.company || '',
        billing_email: user.billing.email || '',
        shipping_first_name: user.shipping.first_name || '',
        shipping_last_name: user.shipping.last_name || '',
        shipping_phone: user.shipping.phone || '',
        shipping_address_1: user.shipping.address_1 || '',
        shipping_address_2: user.shipping.address_2 || '',
        shipping_country: user.shipping.country || '',
        shipping_city: user.shipping.city || '',
        shipping_pobox: user.shipping.pobox || '',
        shipping_company: user.shipping.company || '',
        shipping_email: user.shipping.email || '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        form.setData({ ...form.data, [name]: value });

        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSelectChange = (name: string, value: string | number | number[]) => {
        form.setData({ ...form.data, [name]: value });

        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) {
            return;
        }

        const passwords =
            form.data.general_password && form.data.general_password_confirm
                ? {
                      password: form.data.general_password,
                      password_confirmation: form.data.general_password_confirm,
                  }
                : {};

        form.transform(() => ({
            username: form.data.username,
            general: {
                first_name: form.data.general_first_name,
                last_name: form.data.general_last_name,
                credit_limit_amount: form.data.general_credit_limit_amount,
                group_id: form.data.general_group_id,
                birth_date: form.data.general_birth_date !== '' ? format(new Date(form.data.general_birth_date), 'yyyy-MM-dd HH:mm:ss') : '',
                email: form.data.general_email,
                phone: form.data.general_phone,
                pobox: form.data.general_pobox,
                gender: form.data.general_gender,
                active: form.data.general_active,
                roles: form.data.general_roles,
                ...passwords,
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

        form.put(`/api/crud/ns.users/${user.id}`, {
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

        if (!form.data.username.trim()) {
            form.setError('username', 'First name is required');
            isValid = false;
        }

        if (!form.data.general_group_id) {
            form.setError('general_group_id', 'Group is required');
            isValid = false;
        }

        if (!form.data.general_email) {
            form.setError('general_email', 'Email is required');
            isValid = false;
        }

        return isValid;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Edit user') + ' - JGREM'} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Edit user')}
                        description={t('Edit user')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    {/* Product Name */}
                    <FormField label={t('Username')} error={form.errors.username} description={t('Provide a name to the resource.')} className="mb-2">
                        <Input
                            id="username"
                            name="username"
                            value={form.data.username}
                            onChange={handleInputChange}
                            className={cn(form.errors.username && 'border-destructive')}
                        />
                    </FormField>

                    {/* Tabs */}
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="general">{t('General')}</TabsTrigger>

                            <TabsTrigger value="billing_address">{t('Billing Address')}</TabsTrigger>

                            <TabsTrigger value="shipping_address">{t('Shipping Address')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="mt-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <FormField
                                    label={t('First Name')}
                                    htmlFor="general_first_name"
                                    description={t('First Name')}
                                    error={form.errors?.general_first_name}
                                >
                                    <Input
                                        id="general_first_name"
                                        name="general_first_name"
                                        value={form.data.general_first_name}
                                        onChange={handleInputChange}
                                        className={form.errors?.general_first_name ? 'border-red-500' : ''}
                                    />
                                </FormField>
                                <FormField
                                    label={t('Last Name')}
                                    htmlFor="general_last_name"
                                    description={t('Last Name')}
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
                                    label={t('Email')}
                                    htmlFor="general_email"
                                    description={t('Email')}
                                    error={form.errors?.general_email}
                                    required
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
                                    label={t('Password')}
                                    htmlFor="general_password"
                                    description={t('Make a unique and secure password.')}
                                    error={form.errors?.general_password}
                                >
                                    <Input
                                        id="general_password"
                                        name="general_password"
                                        value={form.data.general_password}
                                        onChange={handleInputChange}
                                        className={form.errors?.general_password ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Confirm Password')}
                                    htmlFor="general_password_confirm"
                                    description={t('Should be the same as the password.')}
                                    error={form.errors?.general_password_confirm}
                                >
                                    <Input
                                        id="general_password_confirm"
                                        name="general_password_confirm"
                                        value={form.data.general_password_confirm}
                                        onChange={handleInputChange}
                                        className={form.errors?.general_password_confirm ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField label={t('Active')} htmlFor="general_active" description={t('Active')} error={form.errors.general_active}>
                                    <ToggleButtons
                                        value={form.data.general_active === 1}
                                        onChange={(value) => handleSelectChange('general_active', value ? 1 : 0)}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Credit Limit')}
                                    htmlFor="general_credit_limit_amount"
                                    description={t('Credit Limit')}
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

                                <FormField label={t('Roles')} description={t('Define what roles applies to the user')}>
                                    <MultiSelector
                                        options={roles}
                                        value={form.data.general_roles}
                                        onChange={(value) => handleSelectChange('general_roles', value)}
                                        placeholder={t('Select') + '...'}
                                        searchPlaceholder={t('Search') + '...'}
                                        emptyText={t('No result to display.')}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Group')}
                                    htmlFor="general_group_id"
                                    description={t('Group')}
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
                                    description={t('Birth Date')}
                                    error={form.errors?.general_birth_date}
                                >
                                    <DatePicker
                                        onDateChange={(value) =>
                                            handleSelectChange('general_birth_date', value ? format(value, 'yyyy-MM-dd HH:mm') : '')
                                        }
                                        date={form.data.general_birth_date}
                                    />
                                </FormField>

                                <FormField label={t('Phone')} htmlFor="general_phone" description={t('Phone')} error={form.errors?.general_phone}>
                                    <Input
                                        id="general_phone"
                                        name="general_phone"
                                        value={form.data.general_phone}
                                        onChange={handleInputChange}
                                        type="tel"
                                        className={form.errors?.general_phone ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField label={t('PO.Box')} htmlFor="general_pobox" description={t('PO.Box')} error={form.errors?.general_pobox}>
                                    <Input
                                        id="general_pobox"
                                        name="general_pobox"
                                        value={form.data.general_pobox}
                                        onChange={handleInputChange}
                                        className={form.errors?.general_pobox ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField label={t('Gender')} htmlFor="general_gender" description={t('Gender')} error={form.errors?.general_gender}>
                                    <Select value={form.data.general_gender} onValueChange={(value) => handleSelectChange('general_gender', value)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('Not Defined')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">{t('Male')}</SelectItem>
                                            <SelectItem value="female">{t('Female')}</SelectItem>
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
                                    description={t('First Name')}
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
                                    description={t('Last Name')}
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
                                <FormField label={t('Phone')} htmlFor="billing_phone" description={t('Phone')} error={form.errors?.billing_phone}>
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
                                    description={t('Address 1')}
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
                                    description={t('Address 2')}
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
                                    description={t('Country')}
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

                                <FormField label={t('PO.Box')} htmlFor="billing_pobox" description={t('PO.Box')} error={form.errors?.billing_pobox}>
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

                                <FormField label={t('Email')} htmlFor="billing_email" description={t('Email')} error={form.errors?.billing_email}>
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
                                    description={t('First Name')}
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
                                    description={t('Last Name')}
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
                                <FormField label={t('Phone')} htmlFor="shipping_phone" description={t('Phone')} error={form.errors?.shipping_phone}>
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
                                    description={t('Address 1')}
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
                                    description={t('Address 2')}
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
                                    description={t('Country')}
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

                                <FormField label={t('PO.Box')} htmlFor="shipping_pobox" description={t('PO.Box')} error={form.errors?.shipping_pobox}>
                                    <Input
                                        id="shipping_pobox"
                                        name="shipping_pobox"
                                        value={form.data.shipping_pobox}
                                        onChange={handleInputChange}
                                        className={form.errors?.shipping_pobox ? 'border-red-500' : ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('Company')}
                                    htmlFor="shipping_company"
                                    description={t('Company')}
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

                                <FormField label={t('Email')} htmlFor="shipping_email" description={t('Email')} error={form.errors?.shipping_email}>
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
