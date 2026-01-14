'use client';

import ConfirmationDialog from '@/components/confirmation-dialog';
import FormField from '@/components/forms/shared/form-field';
import { TokenQrDialog } from '@/components/token-qr-dailog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { CreditCard, Eye, EyeOff, FileText, Home, Key, Lock, RefreshCw, Shield, Trash2, Upload, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function EnhancedProfileSettings() {
    const { t } = useTranslation();
    const { tokens, attributes, currentShipping, currentBilling } = usePage<{
        tokens: ApiToken[] | undefined;
        attributes: UserAttribute;
        currentShipping: Address;
        currentBilling: Address;
    }>().props;
    const [showPassword, setShowPassword] = useState(false);
    const [token, setToken] = useState('');
    const [tokenName, setTokenName] = useState('');
    const [openTokenModal, setOpenTokenModal] = useState(false);
    const [tokenToDelete, setTokenToDelete] = useState<ApiToken | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const form = useForm({
        attribute_theme: attributes.theme || '',
        attribute_avatar_link: attributes.avatar_link || '',
        attribute_language: attributes.language,
        shipping_first_name: currentShipping.first_name || '',
        shipping_last_name: currentShipping.last_name || '',
        shipping_phone: currentShipping.phone || '',
        shipping_address_1: currentShipping.address_1 || '',
        shipping_address_2: currentShipping.address_2 || '',
        shipping_country: currentShipping.country || '',
        shipping_city: currentShipping.city || '',
        shipping_pobox: currentShipping.pobox || '',
        shipping_company: currentShipping.company || '',
        shipping_email: currentShipping.email || '',
        billing_first_name: currentBilling.first_name || '',
        billing_last_name: currentBilling.last_name || '',
        billing_phone: currentBilling.phone || '',
        billing_address_1: currentBilling.address_1 || '',
        billing_address_2: currentBilling.address_2 || '',
        billing_country: currentBilling.country || '',
        billing_city: currentBilling.city || '',
        billing_pobox: currentBilling.pobox || '',
        billing_company: currentBilling.company || '',
        billing_email: currentBilling.email || '',
        security_old_password: '',
        security_password: '',
        security_password_confirm: '',
        token: {},
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

    const getTokens = async () => {
        router.reload({ only: ['tokens'] });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) return;

        const security =
            form.data.security_password !== '' && form.data.security_old_password !== ''
                ? {
                      old_password: form.data.security_old_password,
                      password: form.data.security_password,
                      password_confirm: form.data.security_password_confirm,
                  }
                : {};

        form.transform(() => ({
            attribute: {
                theme: form.data.attribute_theme,
                avatar_link: form.data.attribute_avatar_link,
                language: form.data.attribute_language,
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
            security: security,
            token: {},
        }));

        form.post('/api/forms/ns.user-profile', {
            preserveScroll: true,
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error(t('Please fix the validation errors'));
                console.error('Validation errors:', errors);
            },
            onSuccess: () => {
                toast.success(t('The user attribute has been saved.'));
            },
        });
    };

    const confirmDeleteToken = (token: ApiToken) => {
        setTokenToDelete(token);
        setIsDeleteConfirmOpen(true);
    };

    const handleDeleteToken = () => {
        if (tokenToDelete) {
            axios
                .delete(`/api/users/tokens/${tokenToDelete.id}`)
                .then(() => {
                    toast.success(t('Token deleted successfully'));
                    getTokens();
                    setIsDeleteConfirmOpen(false);
                    setTokenToDelete(null);
                })
                .catch((error) => {
                    if (error.response?.data?.errors) {
                        console.error('Validation errors:', error.response.data.errors);
                        toast.error(t('Please fix the validation errors'));
                    } else {
                        console.error('Unexpected error:', error);
                        toast.error(t('Something went wrong'));
                    }
                });
        }
    };

    const cancelDeleteToken = () => {
        setIsDeleteConfirmOpen(false);
        setTokenToDelete(null);
    };

    const generateToken = () => {
        axios
            .post('/api/users/create-token', { name: tokenName })
            .then((response) => {
                const token = response.data.data.token.plainTextToken;
                console.log('Token:', token);

                setToken(token);
                setOpenTokenModal(true);
                toast.success(t('Token created successfully'));
            })
            .catch((error) => {
                if (error.response?.data?.errors) {
                    console.error('Validation errors:', error.response.data.errors);
                    toast.error(t('Please fix the validation errors'));
                } else {
                    console.error('Unexpected error:', error);
                    toast.error(t('Something went wrong'));
                }
            });
    };

    const validateForm = () => {
        let isValid = true;
        form.clearErrors();

        if (form.data.security_password !== form.data.security_password_confirm) {
            isValid = false;
            form.setError('security_password_confirm', 'The password confirmation does not match.');
        }

        return isValid;
    };

    return (
        <AppLayout breadcrumbs={[]}>
            <Head title={'Category Products'} />
            <form onSubmit={handleSubmit}>
                <div className="flex h-full flex-1 flex-col gap-4 p-4">
                    <div className="w-full">
                        {/* Header */}
                        <div className="mb-8 flex flex-col items-start justify-between md:flex-row md:items-center">
                            <div>
                                <h1 className="text-primary flex items-center gap-2 text-3xl font-bold">
                                    <User className="text-primary h-8 w-8" />
                                    {t('Profile')}
                                </h1>
                                <p className="text-muted-foreground mt-1">{t('Manage your personal account settings and preferences')}</p>
                            </div>

                            <div className="mt-4 flex items-center gap-3 md:mt-0">
                                <Button variant="outline" type="button" onClick={() => form.reset()} className="gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    {t('Reset')}
                                </Button>
                                <Button type="submit" className="gap-2">
                                    {t('Save Changes')}
                                </Button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="overflow-hidden rounded-xl">
                            {/* Tabs */}
                            <Tabs defaultValue="general" className="w-full">
                                <TabsList className="h-12 w-full">
                                    <TabsTrigger value="general">
                                        <User className="h-4 w-4" />
                                        {t('General')}
                                    </TabsTrigger>
                                    <TabsTrigger value="shipping">
                                        <Home className="h-4 w-4" />
                                        {t('Shipping')}
                                    </TabsTrigger>
                                    <TabsTrigger value="billing">
                                        <CreditCard className="h-4 w-4" />
                                        {t('Billing')}
                                    </TabsTrigger>
                                    <TabsTrigger value="security">
                                        <Shield className="h-4 w-4" />
                                        {t('Security')}
                                    </TabsTrigger>
                                    <TabsTrigger value="api" onClick={getTokens}>
                                        <Key className="h-4 w-4" />
                                        {t('API Token')}
                                    </TabsTrigger>
                                </TabsList>

                                {/* General Tab */}
                                <TabsContent value="general" className="space-y-8 pt-4 focus:outline-none">
                                    {/* Appearance */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <Eye className="text-primary h-5 w-5" />
                                                {t('Appearance')}
                                            </CardTitle>
                                            <CardDescription>{t('Customize how your profile looks')}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
                                            {/* Avatar */}
                                            <div className="space-y-3">
                                                <Label className="text-sm font-medium">{t('Profile Picture')}</Label>
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="border-primary-200 h-16 w-16 border-2">
                                                        <AvatarImage src="/placeholder.svg?height=80&width=80" />
                                                        <AvatarFallback className="text-lg">JD</AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-2">
                                                        <Button type="button" variant="outline" size="sm" className="w-full gap-2">
                                                            <Upload className="h-4 w-4" />
                                                            {t('Upload New')}
                                                        </Button>
                                                        <p className="text-muted-foreground text-xs">
                                                            Recommended: Square JPG, PNG, or GIF, at least 200x200 pixels
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Theme */}

                                            <FormField
                                                label={t('Theme')}
                                                description={t('Choose how the dashboard looks to you')}
                                                htmlFor="attribute_theme"
                                                error={form.errors.attribute_theme}
                                            >
                                                <Select
                                                    value={form.data.attribute_theme}
                                                    onValueChange={(value) => handleSelectChange('attribute_theme', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={t('Select theme')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="light">{t('Light')}</SelectItem>
                                                        <SelectItem value="dark">{t('Dark')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormField>

                                            {/* Language */}
                                            <FormField
                                                label={t('Language')}
                                                description={t('Choose your preferred language for the interface')}
                                                htmlFor="attribute_language"
                                                error={form.errors.attribute_language}
                                            >
                                                <Select
                                                    value={form.data.attribute_language}
                                                    onValueChange={(value) => handleSelectChange('attribute_language', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={t('Select language')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="en">{t('English')}</SelectItem>
                                                        <SelectItem value="ar">{t('Arabic')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormField>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Shipping Tab */}
                                <TabsContent value="shipping" className="space-y-6 pt-4 focus:outline-none">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <Home className="text-primary h-5 w-5" />
                                                {t('Shipping Information')}
                                            </CardTitle>
                                            <CardDescription>{t('Manage your shipping details')}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Name Fields */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <FormField
                                                    label={t('First Name')}
                                                    htmlFor="shipping_first_name"
                                                    description={t('Provide the shipping first name.')}
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
                                                    description={t('Provide the shipping last name.')}
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
                                                    description={t('Shipping contact number.')}
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
                                            </div>

                                            <Separator />

                                            {/* Address Fields */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <FormField
                                                    label={t('Address Line 1')}
                                                    htmlFor="shipping_address_1"
                                                    description={t('Street address, P.O. box, company name')}
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
                                                    label="Address Line 2"
                                                    htmlFor="shipping_address_1"
                                                    description="Apartment, suite, unit, building, floor, etc."
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
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <FormField
                                                    label={t('Country')}
                                                    htmlFor="shipping_country"
                                                    description={t('Shipping country')}
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

                                                <FormField
                                                    label={t('City')}
                                                    htmlFor="shipping_city"
                                                    description={t('City or town')}
                                                    error={form.errors?.shipping_city}
                                                >
                                                    <Input
                                                        id="shipping_city"
                                                        name="shipping_city"
                                                        value={form.data.shipping_city}
                                                        onChange={handleInputChange}
                                                        className={form.errors?.shipping_city ? 'border-red-500' : ''}
                                                    />
                                                </FormField>

                                                <FormField
                                                    label={t('PO Box')}
                                                    htmlFor="shipping_pobox"
                                                    description={t('Postal Address')}
                                                    error={form.errors?.shipping_pobox}
                                                >
                                                    <Input
                                                        id="shipping_pobox"
                                                        name="shipping_pobox"
                                                        value={form.data.shipping_pobox}
                                                        onChange={handleInputChange}
                                                        className={form.errors?.shipping_pobox ? 'border-red-500' : ''}
                                                    />
                                                </FormField>
                                            </div>

                                            <FormField
                                                label={t('Email')}
                                                htmlFor="shipping_email"
                                                description={t('Shipping email address')}
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
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Billing Tab */}
                                <TabsContent value="billing" className="space-y-6 pt-4 focus:outline-none">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <Home className="text-primary h-5 w-5" />
                                                {t('Billing Information')}
                                            </CardTitle>
                                            <CardDescription>{t('Manage your Billing details')}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Name Fields */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                                                    description={t('Billing contact number.')}
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
                                            </div>

                                            <Separator />

                                            {/* Address Fields */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <FormField
                                                    label={t('Address Line 1')}
                                                    htmlFor="billing_address_1"
                                                    description={t('Street address, P.O. box, company name')}
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
                                                    label={t('Address Line 2')}
                                                    htmlFor="billing_address_1"
                                                    description={t('Apartment, suite, unit, building, floor, etc.')}
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
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <FormField
                                                    label={t('Country')}
                                                    htmlFor="billing_country"
                                                    description={t('Billing country')}
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

                                                <FormField
                                                    label={t('City')}
                                                    htmlFor="billing_city"
                                                    description={t('City or town')}
                                                    error={form.errors?.billing_city}
                                                >
                                                    <Input
                                                        id="billing_city"
                                                        name="billing_city"
                                                        value={form.data.billing_city}
                                                        onChange={handleInputChange}
                                                        className={form.errors?.billing_city ? 'border-red-500' : ''}
                                                    />
                                                </FormField>

                                                <FormField
                                                    label={t('PO Box')}
                                                    htmlFor="billing_pobox"
                                                    description={t('Postal Address')}
                                                    error={form.errors?.billing_pobox}
                                                >
                                                    <Input
                                                        id="billing_pobox"
                                                        name="billing_pobox"
                                                        value={form.data.billing_pobox}
                                                        onChange={handleInputChange}
                                                        className={form.errors?.billing_pobox ? 'border-red-500' : ''}
                                                    />
                                                </FormField>
                                            </div>

                                            <FormField
                                                label={t('Email')}
                                                htmlFor="billing_email"
                                                description={t('Billing email address')}
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
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Security Tab */}
                                <TabsContent value="security" className="space-y-6 pt-4 focus:outline-none">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <Lock className="text-primary h-5 w-5" />
                                                {t('Password Management')}
                                            </CardTitle>
                                            <CardDescription>{t('Update your password to keep your account secure')}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <FormField
                                                    label={t('Current Password')}
                                                    htmlFor="security_old_password"
                                                    description={t('Enter your Current password')}
                                                    error={form.errors?.security_old_password}
                                                >
                                                    <div className="relative">
                                                        <Lock className="text-primary-400 absolute top-3 left-3 h-4 w-4" />
                                                        <Input
                                                            id="security_old_password"
                                                            name="security_old_password"
                                                            value={form.data.security_old_password}
                                                            onChange={handleInputChange}
                                                            className={
                                                                form.errors?.security_old_password ? 'border-red-500 pr-10 pl-10' : 'pr-10 pl-10'
                                                            }
                                                            type={showPassword ? 'text' : 'password'}
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="text-primary-400 hover:text-primary-600 absolute top-3 right-3"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </FormField>

                                                <FormField
                                                    label={t('New Password')}
                                                    htmlFor="security_password"
                                                    description={t('At least 8 characters with letters and numbers')}
                                                    error={form.errors?.security_password}
                                                >
                                                    <div className="relative">
                                                        <Lock className="text-primary-400 absolute top-3 left-3 h-4 w-4" />
                                                        <Input
                                                            id="security_password"
                                                            name="security_password"
                                                            value={form.data.security_password}
                                                            onChange={handleInputChange}
                                                            className={form.errors?.security_password ? 'border-red-500 pr-10 pl-10' : 'pr-10 pl-10'}
                                                            type={showPassword ? 'text' : 'password'}
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="text-primary-400 hover:text-primary-600 absolute top-3 right-3"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </FormField>

                                                <FormField
                                                    label={t('Confirm New Password')}
                                                    htmlFor="security_password_confirm"
                                                    description={t('Re-enter your new password')}
                                                    error={form.errors?.security_password_confirm}
                                                >
                                                    <div className="relative">
                                                        <Lock className="text-primary-400 absolute top-3 left-3 h-4 w-4" />
                                                        <Input
                                                            id="security_password_confirm"
                                                            name="security_password_confirm"
                                                            value={form.data.security_password_confirm}
                                                            onChange={handleInputChange}
                                                            className={
                                                                form.errors?.security_password_confirm ? 'border-red-500 pr-10 pl-10' : 'pr-10 pl-10'
                                                            }
                                                            type={showPassword ? 'text' : 'password'}
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="text-primary-400 hover:text-primary-600 absolute top-3 right-3"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </FormField>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* API Token Tab */}
                                <TabsContent value="api" className="space-y-6 pt-4 focus:outline-none">
                                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="flex gap-3">
                                            <div className="mt-0.5 text-blue-600">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="mb-1 font-medium text-blue-800">{t('About API Tokens')}</h3>
                                                <p className="text-sm text-blue-700">
                                                    {t(
                                                        'API tokens provide secure access to resources without sharing your personal credentials. Tokens remain active until explicitly revoked. Keep your tokens secure and never share them publicly.',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <Key className="text-primary h-5 w-5" />
                                                {t('Create New Token')}
                                            </CardTitle>
                                            <CardDescription>{t('Generate a new API token for your applications')}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <FormField
                                                    label={t('Token Name')}
                                                    htmlFor="tokenName"
                                                    description={t('A descriptive name to identify this token')}
                                                >
                                                    <div className="relative">
                                                        <FileText className="text-primary-400 absolute top-3 left-3 h-4 w-4" />
                                                        <Input
                                                            id="tokenName"
                                                            name="tokenName"
                                                            value={tokenName}
                                                            onChange={(e) => setTokenName(e.target.value)}
                                                            className={'pr-10 pl-10'}
                                                            placeholder="My API Token"
                                                        />
                                                    </div>
                                                </FormField>
                                            </div>

                                            <div className="pt-2">
                                                <Button type="button" onClick={generateToken}>
                                                    {t('Generate Token')}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <Key className="text-primary h-5 w-5" />
                                                {t('Active Tokens')}
                                            </CardTitle>
                                            <CardDescription>{t('Manage your existing API tokens')}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {tokens === undefined || tokens?.length === 0 ? (
                                                <div className="py-8 text-center text-slate-500">
                                                    <p>{t("You haven't generated any tokens yet.")}</p>
                                                    <p className="mt-1 text-sm">{t('Create your first token to get started.')}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {tokens.map((token) => (
                                                        <div key={token.id} className="rounded-lg border p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <Key className="h-5 w-5" />
                                                                    <div>
                                                                        <div className="font-medium">{token.name}</div>
                                                                        <div className="text-xs">Created {token.created_at}</div>
                                                                    </div>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="ml-2 border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-800 dark:text-green-400"
                                                                    >
                                                                        Active
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                                        onClick={() => confirmDeleteToken(token)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                    <TokenQrDialog isOpen={openTokenModal} onClose={() => setOpenTokenModal(false)} tokenName={tokenName} tokenValue={token} />
                    <ConfirmationDialog
                        isOpen={isDeleteConfirmOpen}
                        onClose={cancelDeleteToken}
                        onConfirm={handleDeleteToken}
                        title={t('Revoke API Token')}
                        description={
                            tokenToDelete
                                ? t(
                                      'Are you sure you want to revoke the token "{{name}}"? This action cannot be undone and any applications using this token will lose access.',
                                      { name: tokenToDelete.name },
                                  )
                                : t('Are you sure you want to revoke this token?')
                        }
                        confirmText={t('Revoke Token')}
                        cancelText={t('Cancel')}
                        variant="destructive"
                    />
                </div>
            </form>
        </AppLayout>
    );
}
