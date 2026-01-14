import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { InertiaFormProps } from '@inertiajs/react';
import FormField from '../forms/shared/form-field';
import ToggleButtons from '../forms/shared/toggle-buttons';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: InertiaFormProps<OrderFormValuesType>;
    useBillingAddress: boolean;
    useShippingAddress: boolean;
    setUseBillingAddress: (useBillingAddress: boolean) => void;
    setUseShippingAddress: (useShippingAddress: boolean) => void;
    onOpenSelectCustomerDialog: () => void;
}

export function ShippingDialog({
    open,
    onOpenChange,
    form,
    useBillingAddress,
    useShippingAddress,
    setUseBillingAddress,
    setUseShippingAddress,
    onOpenSelectCustomerDialog,
}: Props) {
    const { t } = useTranslation();

    const handleUseBillingAddress = () => {
        setUseBillingAddress(!useBillingAddress);
        if (useBillingAddress) return;
        if (!form.data.customer) return onOpenSelectCustomerDialog();
        form.setData('addresses.billing', form.data.customer.billing);
    };

    const handleUseShippingAddress = () => {
        setUseShippingAddress(!useShippingAddress);
        if (useShippingAddress) return;
        if (!form.data.customer) return onOpenSelectCustomerDialog();
        form.setData('addresses.shipping', form.data.customer.shipping);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn('flex h-[90vh] max-h-[90vh] w-[50vw] max-w-[50vw] flex-col sm:max-w-[50vw]')}>
                <DialogTitle>{t('Shipping & Billing')}</DialogTitle>
                <DialogDescription className="sr-only">{t('Shipping & Billing')}</DialogDescription>
                <Tabs defaultValue="general">
                    <TabsList>
                        <TabsTrigger value="general">{t('General Shipping')}</TabsTrigger>
                        <TabsTrigger value="billing">{t('Billing Address')}</TabsTrigger>
                        <TabsTrigger value="shipping">{t('Shipping Address')}</TabsTrigger>
                    </TabsList>
                    <Separator />
                    <TabsContent value="general" className="flex w-full flex-row gap-4">
                        <div className="flex-1">
                            <Label className="text-sm font-medium">{t('Shipping Type')}</Label>
                            <div className="mt-2">
                                <Select value={form.data.shipping_type} onValueChange={(value) => form.setData('shipping_type', value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('Not set')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem key={'flat'} value={'flat'}>
                                            {t('Flat')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-muted-foreground mt-1 text-sm">{t('Define how the shipping is calculated.')}</p>
                        </div>
                        <div className="flex-1">
                            <Label className="text-sm font-medium">{t('Shipping Fees')}</Label>
                            <div className="mt-2">
                                <Input type="number" value={form.data.shipping} onChange={(e) => form.setData('shipping', +e.target.value)} />
                            </div>
                            <p className="text-muted-foreground mt-1 text-sm">{t('Define shipping fees.')}</p>
                        </div>
                    </TabsContent>
                    <TabsContent value="billing" className="flex w-full flex-row gap-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <FormField
                                label={t('Use Customer Billing')}
                                description={t('Define whether the customer billing information should be used.')}
                            >
                                <ToggleButtons value={useBillingAddress} onChange={handleUseBillingAddress} />
                            </FormField>
                            <FormField
                                label={t('First Name')}
                                htmlFor="addresses.billing.first_name"
                                description={t('Provide the billing first name.')}
                            >
                                <Input
                                    id="addresses.billing.first_name"
                                    name="addresses.billing.first_name"
                                    value={form.data?.addresses?.billing?.first_name || ''}
                                    onChange={(e) => form.setData('addresses.billing.first_name', e.target.value)}
                                    className={form.errors?.['addresses.billing.first_name'] ? 'border-red-500' : ''}
                                />
                            </FormField>
                            <FormField
                                label={t('Last Name')}
                                htmlFor="billing_last_name"
                                description={t('Provide the billing last name.')}
                                error={form.errors?.['addresses.billing.last_name']}
                            >
                                <Input
                                    id="addresses.billing.last_name"
                                    name="addresses.billing.last_name"
                                    value={form.data?.addresses?.billing?.last_name || ''}
                                    onChange={(e) => form.setData('addresses.billing.last_name', e.target.value)}
                                    className={form.errors?.['addresses.billing.last_name'] ? 'border-red-500' : ''}
                                />
                            </FormField>
                            <FormField
                                label={t('Phone')}
                                htmlFor="addresses.billing.phone"
                                description={t('Provide the Billing phone number.')}
                                error={form.errors?.['addresses.billing.phone']}
                            >
                                <Input
                                    id="addresses.billing.phone"
                                    name="addresses.billing.phone"
                                    value={form.data?.addresses?.billing?.phone || ''}
                                    onChange={(e) => form.setData('addresses.billing.phone', e.target.value)}
                                    className={form.errors?.['addresses.billing.phone'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('Address 1')}
                                htmlFor="addresses.billing.address_1"
                                description={t('Provide the Billing First Address.')}
                                error={form.errors?.['addresses.billing.address_1']}
                            >
                                <Input
                                    id="addresses.billing.address_1"
                                    name="addresses.billing.address_1"
                                    value={form.data?.addresses?.billing?.address_1 || ''}
                                    onChange={(e) => form.setData('addresses.billing.address_1', e.target.value)}
                                    className={form.errors?.['addresses.billing.address_1'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('Address 2')}
                                htmlFor="addresses.billing.address_2"
                                description={t('Provide the Billing Second Address.')}
                                error={form.errors?.['addresses.billing.address_2']}
                            >
                                <Input
                                    id="addresses.billing.address_2"
                                    name="addresses.billing.address_2"
                                    value={form.data?.addresses?.billing?.address_2 || ''}
                                    onChange={(e) => form.setData('addresses.billing.address_2', e.target.value)}
                                    className={form.errors?.['addresses.billing.address_2'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('Country')}
                                htmlFor="addresses.billing.country"
                                description={t('Provide Billing Country.')}
                                error={form.errors?.['addresses.billing.country']}
                            >
                                <Input
                                    id="addresses.billing.country"
                                    name="addresses.billing.country"
                                    value={form.data?.addresses?.billing?.country || ''}
                                    onChange={(e) => form.setData('addresses.billing.country', e.target.value)}
                                    className={form.errors?.['addresses.billing.country'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('City')}
                                htmlFor="addresses.billing.city"
                                description={t('Provide Billing city.')}
                                error={form.errors?.['addresses.billing.city']}
                            >
                                <Input
                                    id="addresses.billing.city"
                                    name="addresses.billing.city"
                                    value={form.data?.addresses?.billing?.city || ''}
                                    onChange={(e) => form.setData('addresses.billing.city', e.target.value)}
                                    className={form.errors?.['addresses.billing.city'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('PO Box')}
                                htmlFor="addresses.billing.pobox"
                                description={t('Provide Postal code.')}
                                error={form.errors?.['addresses.billing.pobox']}
                            >
                                <Input
                                    id="addresses.billing.pobox"
                                    name="addresses.billing.pobox"
                                    value={form.data?.addresses?.billing?.pobox || ''}
                                    onChange={(e) => form.setData('addresses.billing.pobox', e.target.value)}
                                    className={form.errors?.['addresses.billing.pobox'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('Company')}
                                htmlFor="addresses.billing.company"
                                description={t('Company name.')}
                                error={form.errors?.['addresses.billing.company']}
                            >
                                <Input
                                    id="addresses.billing.company"
                                    name="addresses.billing.company"
                                    value={form.data?.addresses?.billing?.company || ''}
                                    onChange={(e) => form.setData('addresses.billing.company', e.target.value)}
                                    className={form.errors?.['addresses.billing.company'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('Email')}
                                htmlFor="addresses.billing.email"
                                description={t('Provide the billing email.')}
                                error={form.errors?.['addresses.billing.email']}
                            >
                                <Input
                                    id="addresses.billing.email"
                                    name="addresses.billing.email"
                                    value={form.data?.addresses?.billing?.email || ''}
                                    onChange={(e) => form.setData('addresses.billing.email', e.target.value)}
                                    className={form.errors?.['addresses.billing.email'] ? 'border-red-500' : ''}
                                />
                            </FormField>
                        </div>
                    </TabsContent>

                    <TabsContent value="shipping" className="flex w-full flex-row gap-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <FormField
                                label={t('Use Customer Shipping')}
                                description={t('Define whether the customer shipping information should be used.')}
                            >
                                <ToggleButtons value={useShippingAddress} onChange={handleUseShippingAddress} />
                            </FormField>
                            <FormField
                                label={t('First Name')}
                                htmlFor="addresses.shipping.first_name"
                                description={t('Provide the shipping first name.')}
                            >
                                <Input
                                    id="addresses.shipping.first_name"
                                    name="addresses.shipping.first_name"
                                    value={form.data?.addresses?.shipping?.first_name || ''}
                                    onChange={(e) => form.setData('addresses.shipping.first_name', e.target.value)}
                                    className={form.errors?.['addresses.shipping.first_name'] ? 'border-red-500' : ''}
                                />
                            </FormField>
                            <FormField
                                label={t('Last Name')}
                                htmlFor="billing_last_name"
                                description={t('Provide the shipping last name.')}
                                error={form.errors?.['addresses.shipping.last_name']}
                            >
                                <Input
                                    id="addresses.shipping.last_name"
                                    name="addresses.shipping.last_name"
                                    value={form.data?.addresses?.shipping?.last_name || ''}
                                    onChange={(e) => form.setData('addresses.shipping.last_name', e.target.value)}
                                    className={form.errors?.['addresses.shipping.last_name'] ? 'border-red-500' : ''}
                                />
                            </FormField>
                            <FormField
                                label={t('Phone')}
                                htmlFor="addresses.shipping.phone"
                                description={t('Provide the Shipping phone number.')}
                                error={form.errors?.['addresses.shipping.phone']}
                            >
                                <Input
                                    id="addresses.shipping.phone"
                                    name="addresses.shipping.phone"
                                    value={form.data?.addresses?.shipping?.phone || ''}
                                    onChange={(e) => form.setData('addresses.shipping.phone', e.target.value)}
                                    className={form.errors?.['addresses.shipping.phone'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('Address 1')}
                                htmlFor="addresses.shipping.address_1"
                                description={t('Provide the Shipping First Address.')}
                                error={form.errors?.['addresses.shipping.address_1']}
                            >
                                <Input
                                    id="addresses.shipping.address_1"
                                    name="addresses.shipping.address_1"
                                    value={form.data?.addresses?.shipping?.address_1 || ''}
                                    onChange={(e) => form.setData('addresses.shipping.address_1', e.target.value)}
                                    className={form.errors?.['addresses.shipping.address_1'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('Address 2')}
                                htmlFor="addresses.shipping.address_2"
                                description={t('Provide the Shipping Second Address.')}
                                error={form.errors?.['addresses.shipping.address_2']}
                            >
                                <Input
                                    id="addresses.shipping.address_2"
                                    name="addresses.shipping.address_2"
                                    value={form.data?.addresses?.shipping?.address_2 || ''}
                                    onChange={(e) => form.setData('addresses.shipping.address_2', e.target.value)}
                                    className={form.errors?.['addresses.shipping.address_2'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('Country')}
                                htmlFor="addresses.shipping.country"
                                description={t('Provide Shipping Country.')}
                                error={form.errors?.['addresses.shipping.country']}
                            >
                                <Input
                                    id="addresses.shipping.country"
                                    name="addresses.shipping.country"
                                    value={form.data?.addresses?.shipping?.country || ''}
                                    onChange={(e) => form.setData('addresses.shipping.country', e.target.value)}
                                    className={form.errors?.['addresses.shipping.country'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('City')}
                                htmlFor="addresses.shipping.city"
                                description={t('Provide Shipping city.')}
                                error={form.errors?.['addresses.shipping.city']}
                            >
                                <Input
                                    id="addresses.shipping.city"
                                    name="addresses.shipping.city"
                                    value={form.data?.addresses?.shipping?.city || ''}
                                    onChange={(e) => form.setData('addresses.shipping.city', e.target.value)}
                                    className={form.errors?.['addresses.shipping.city'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('PO Box')}
                                htmlFor="addresses.shipping.pobox"
                                description={t('Provide Postal code.')}
                                error={form.errors?.['addresses.shipping.pobox']}
                            >
                                <Input
                                    id="addresses.shipping.pobox"
                                    name="addresses.shipping.pobox"
                                    value={form.data?.addresses?.shipping?.pobox || ''}
                                    onChange={(e) => form.setData('addresses.shipping.pobox', e.target.value)}
                                    className={form.errors?.['addresses.shipping.pobox'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('Company')}
                                htmlFor="addresses.shipping.company"
                                description={t('Company name.')}
                                error={form.errors?.['addresses.shipping.company']}
                            >
                                <Input
                                    id="addresses.shipping.company"
                                    name="addresses.shipping.company"
                                    value={form.data?.addresses?.shipping?.company || ''}
                                    onChange={(e) => form.setData('addresses.shipping.company', e.target.value)}
                                    className={form.errors?.['addresses.shipping.company'] ? 'border-red-500' : ''}
                                />
                            </FormField>

                            <FormField
                                label={t('Email')}
                                htmlFor="addresses.shipping.email"
                                description={t('Provide the shipping email.')}
                                error={form.errors?.['addresses.shipping.email']}
                            >
                                <Input
                                    id="addresses.shipping.email"
                                    name="addresses.shipping.email"
                                    value={form.data?.addresses?.shipping?.email || ''}
                                    onChange={(e) => form.setData('addresses.shipping.email', e.target.value)}
                                    className={form.errors?.['addresses.shipping.email'] ? 'border-red-500' : ''}
                                />
                            </FormField>
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter className="mt-auto">
                    <Button onClick={() => onOpenChange(false)}>{t('Save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
