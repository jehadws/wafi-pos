import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import FormField from '../forms/shared/form-field';
import ToggleButtons from '../forms/shared/toggle-buttons';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    useBillingAddress: boolean;
    useShippingAddress: boolean;
    setUseBillingAddress: (useBillingAddress: boolean) => void;
    setUseShippingAddress: (useShippingAddress: boolean) => void;
    onOpenSelectCustomerDialog: () => void;
}

export function ShippingDialog({
    open,
    onOpenChange,
    useBillingAddress,
    useShippingAddress,
    setUseBillingAddress,
    setUseShippingAddress,
    onOpenSelectCustomerDialog,
}: Props) {
    const { t } = useTranslation();
    const { order, updateAddress, setShipping } = usePOS();

    const handleUseBillingAddress = () => {
        setUseBillingAddress(!useBillingAddress);
        if (useBillingAddress) return;
        if (!order.customer) return onOpenSelectCustomerDialog();
        updateAddress('billing', order.customer.billing);
    };

    const handleUseShippingAddress = () => {
        setUseShippingAddress(!useShippingAddress);
        if (useShippingAddress) return;
        if (!order.customer) return onOpenSelectCustomerDialog();
        updateAddress('shipping', order.customer.shipping);
    };

    const handleShippingTypeChange = (value: string) => {
        setShipping(order.shipping, value);
    };

    const handleShippingChange = (value: number) => {
        setShipping(value, order.shipping_type);
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
                                <Select value={order.shipping_type || 'flat'} onValueChange={handleShippingTypeChange}>
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
                                <Input type="number" value={order.shipping} onChange={(e) => handleShippingChange(+e.target.value)} />
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
                                    value={order.addresses?.billing?.first_name || ''}
                                    onChange={(e) => updateAddress('billing', { ...order.addresses?.billing, first_name: e.target.value })}
                                    className={''}
                                />
                            </FormField>
                            <FormField label={t('Last Name')} htmlFor="billing_last_name" description={t('Provide the billing last name.')}>
                                <Input
                                    id="addresses.billing.last_name"
                                    name="addresses.billing.last_name"
                                    value={order.addresses?.billing?.last_name || ''}
                                    onChange={(e) => updateAddress('billing', { ...order.addresses?.billing, last_name: e.target.value })}
                                    className={''}
                                />
                            </FormField>
                            <FormField label={t('Phone')} htmlFor="addresses.billing.phone" description={t('Provide the Billing phone number.')}>
                                <Input
                                    id="addresses.billing.phone"
                                    name="addresses.billing.phone"
                                    value={order.addresses?.billing?.phone || ''}
                                    onChange={(e) => updateAddress('billing', { ...order.addresses?.billing, phone: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField
                                label={t('Address 1')}
                                htmlFor="addresses.billing.address_1"
                                description={t('Provide the Billing First Address.')}
                            >
                                <Input
                                    id="addresses.billing.address_1"
                                    name="addresses.billing.address_1"
                                    value={order.addresses?.billing?.address_1 || ''}
                                    onChange={(e) => updateAddress('billing', { ...order.addresses?.billing, address_1: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField
                                label={t('Address 2')}
                                htmlFor="addresses.billing.address_2"
                                description={t('Provide the Billing Second Address.')}
                            >
                                <Input
                                    id="addresses.billing.address_2"
                                    name="addresses.billing.address_2"
                                    value={order.addresses?.billing?.address_2 || ''}
                                    onChange={(e) => updateAddress('billing', { ...order.addresses?.billing, address_2: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField label={t('Country')} htmlFor="addresses.billing.country" description={t('Provide Billing Country.')}>
                                <Input
                                    id="addresses.billing.country"
                                    name="addresses.billing.country"
                                    value={order.addresses?.billing?.country || ''}
                                    onChange={(e) => updateAddress('billing', { ...order.addresses?.billing, country: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField label={t('City')} htmlFor="addresses.billing.city" description={t('Provide Billing city.')}>
                                <Input
                                    id="addresses.billing.city"
                                    name="addresses.billing.city"
                                    value={order.addresses?.billing?.city || ''}
                                    onChange={(e) => updateAddress('billing', { ...order.addresses?.billing, city: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField label={t('PO Box')} htmlFor="addresses.billing.pobox" description={t('Provide Postal code.')}>
                                <Input
                                    id="addresses.billing.pobox"
                                    name="addresses.billing.pobox"
                                    value={order.addresses?.billing?.pobox || ''}
                                    onChange={(e) => updateAddress('billing', { ...order.addresses?.billing, pobox: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField label={t('Company')} htmlFor="addresses.billing.company" description={t('Company name.')}>
                                <Input
                                    id="addresses.billing.company"
                                    name="addresses.billing.company"
                                    value={order.addresses?.billing?.company || ''}
                                    onChange={(e) => updateAddress('billing', { ...order.addresses?.billing, company: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField label={t('Email')} htmlFor="addresses.billing.email" description={t('Provide the billing email.')}>
                                <Input
                                    id="addresses.billing.email"
                                    name="addresses.billing.email"
                                    value={order.addresses?.billing?.email || ''}
                                    onChange={(e) => updateAddress('billing', { ...order.addresses?.billing, email: e.target.value })}
                                    className={''}
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
                                    value={order.addresses?.shipping?.first_name || ''}
                                    onChange={(e) => updateAddress('shipping', { ...order.addresses?.shipping, first_name: e.target.value })}
                                    className={''}
                                />
                            </FormField>
                            <FormField label={t('Last Name')} htmlFor="billing_last_name" description={t('Provide the shipping last name.')}>
                                <Input
                                    id="addresses.shipping.last_name"
                                    name="addresses.shipping.last_name"
                                    value={order.addresses?.shipping?.last_name || ''}
                                    onChange={(e) => updateAddress('shipping', { ...order.addresses?.shipping, last_name: e.target.value })}
                                    className={''}
                                />
                            </FormField>
                            <FormField label={t('Phone')} htmlFor="addresses.shipping.phone" description={t('Provide the Shipping phone number.')}>
                                <Input
                                    id="addresses.shipping.phone"
                                    name="addresses.shipping.phone"
                                    value={order.addresses?.shipping?.phone || ''}
                                    onChange={(e) => updateAddress('shipping', { ...order.addresses?.shipping, phone: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField
                                label={t('Address 1')}
                                htmlFor="addresses.shipping.address_1"
                                description={t('Provide the Shipping First Address.')}
                            >
                                <Input
                                    id="addresses.shipping.address_1"
                                    name="addresses.shipping.address_1"
                                    value={order.addresses?.shipping?.address_1 || ''}
                                    onChange={(e) => updateAddress('shipping', { ...order.addresses?.shipping, address_1: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField
                                label={t('Address 2')}
                                htmlFor="addresses.shipping.address_2"
                                description={t('Provide the Shipping Second Address.')}
                            >
                                <Input
                                    id="addresses.shipping.address_2"
                                    name="addresses.shipping.address_2"
                                    value={order.addresses?.shipping?.address_2 || ''}
                                    onChange={(e) => updateAddress('shipping', { ...order.addresses?.shipping, address_2: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField label={t('Country')} htmlFor="addresses.shipping.country" description={t('Provide Shipping Country.')}>
                                <Input
                                    id="addresses.shipping.country"
                                    name="addresses.shipping.country"
                                    value={order.addresses?.shipping?.country || ''}
                                    onChange={(e) => updateAddress('shipping', { ...order.addresses?.shipping, country: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField label={t('City')} htmlFor="addresses.shipping.city" description={t('Provide Shipping city.')}>
                                <Input
                                    id="addresses.shipping.city"
                                    name="addresses.shipping.city"
                                    value={order.addresses?.shipping?.city || ''}
                                    onChange={(e) => updateAddress('shipping', { ...order.addresses?.shipping, city: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField label={t('PO Box')} htmlFor="addresses.shipping.pobox" description={t('Provide Postal code.')}>
                                <Input
                                    id="addresses.shipping.pobox"
                                    name="addresses.shipping.pobox"
                                    value={order.addresses?.shipping?.pobox || ''}
                                    onChange={(e) => updateAddress('shipping', { ...order.addresses?.shipping, pobox: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField label={t('Company')} htmlFor="addresses.shipping.company" description={t('Company name.')}>
                                <Input
                                    id="addresses.shipping.company"
                                    name="addresses.shipping.company"
                                    value={order.addresses?.shipping?.company || ''}
                                    onChange={(e) => updateAddress('shipping', { ...order.addresses?.shipping, company: e.target.value })}
                                    className={''}
                                />
                            </FormField>

                            <FormField label={t('Email')} htmlFor="addresses.shipping.email" description={t('Provide the shipping email.')}>
                                <Input
                                    id="addresses.shipping.email"
                                    name="addresses.shipping.email"
                                    value={order.addresses?.shipping?.email || ''}
                                    onChange={(e) => updateAddress('shipping', { ...order.addresses?.shipping, email: e.target.value })}
                                    className={''}
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
