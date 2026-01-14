import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { InertiaFormProps } from '@inertiajs/react';
import axios from 'axios';
import { CreditCard, PauseCircle, Percent, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';

type Props = {
    form: InertiaFormProps<OrderFormValuesType>;
    setShowPaymentGatewayDialog: (value: boolean) => void;
    useBillingAddress: boolean;
    useShippingAddress: boolean;
    resetCart: () => void;
    setShouldValidate: (value: boolean) => void;
    onOpenDiscountDialog: () => void;
};

export default function PaymentActions({
    form,
    onOpenDiscountDialog,
    setShouldValidate,
    setShowPaymentGatewayDialog,
    useBillingAddress,
    useShippingAddress,
    resetCart,
}: Props) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isVoidOpen, setIsVoidOpen] = useState(false);
    const handleSubmit = () => {
        if (!form.data.products.length) {
            toast.error(t('You need to provide some products before proceeding'));
            return;
        }
        if (!form.data.customer || !form.data.customer_id || !form.data.type) {
            setShouldValidate(true);
            return;
        }
        setShowPaymentGatewayDialog(true);
    };

    const handleOnHold = async () => {
        if (form.data.id) {
            try {
                const res = await axios.put(`/api/orders/${form.data.id}`, {
                    ...form.data,
                    customer: {
                        ...form.data.customer,
                        selected: true,
                    },
                    payment_status: 'hold',
                    addresses: {
                        billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
                        shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
                    },
                });

                if (res.data) {
                    toast.success(t('Order Placed as On Hold'));
                    resetCart();
                    setIsOpen(false);
                }
            } catch (error) {
                console.log(error);
                toast.error(t('Something went wrong. Please try again'));
            }
        } else {
            try {
                const res = await axios.post('/api/orders', {
                    ...form.data,
                    customer: {
                        ...form.data.customer,
                        selected: true,
                    },
                    payment_status: 'hold',
                    addresses: {
                        billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
                        shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
                    },
                });

                if (res.data) {
                    toast.success(t('Order Placed as On Hold'));
                    resetCart();
                    setIsOpen(false);
                }
            } catch (error) {
                console.log(error);
                toast.error(t('Something went wrong. Please try again'));
            }
        }
    };

    const handleOnVoid = async () => {
        if (!form.data.id) return toast.error(t('Unable to void an unpaid order.'));
        try {
            const res = await axios.post(`/api/orders/${form.data.id}/void`, {
                reason: '',
            });

            if (res.data) {
                toast.success(t('The order has been deleted.'));
                resetCart();
                setIsVoidOpen(false);
            }
        } catch (error) {
            console.log(error);
            toast.error(t('Something went wrong. Please try again'));
        }
    };

    return (
        <>
            <div className="grid grid-cols-4">
                <Button
                    className={cn('rounded-none bg-green-500 py-6 text-white hover:bg-green-600')}
                    onClick={handleSubmit}
                    variant="default"
                    type="button"
                >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {t('Pay')}
                </Button>
                <Button
                    onClick={() => {
                        if (form.data.tendered > 0) {
                            return toast.error(t('Unable to hold an order which payment status has been updated already.'));
                        }

                        if (!form.data.products.length) {
                            toast.error(t('You need to provide some products before proceeding.'));
                            return;
                        }
                        if (!form.data.customer || !form.data.customer_id || !form.data.type) {
                            setShouldValidate(true);
                            return;
                        }

                        setIsOpen(true);
                    }}
                    className={cn('rounded-none bg-blue-500 py-6 text-white hover:bg-blue-600')}
                    variant="secondary"
                    type="button"
                >
                    <PauseCircle className="mr-2 h-5 w-5" />
                    {t('Hold')}
                </Button>
                <Button className="rounded-none border-0 py-6" variant="default" type="button" onClick={onOpenDiscountDialog}>
                    <Percent className="mr-2 h-5 w-5" />
                    {t('Discount')}
                </Button>
                <Button
                    className="rounded-none py-6"
                    variant="destructive"
                    type="button"
                    onClick={() => {
                        if (!form.data.id) {
                            toast.error(t('Unable to void an unpaid order.'));
                            return;
                        }

                        setIsVoidOpen(true);
                    }}
                >
                    <XCircle className="mr-2 h-5 w-5" />
                    {t('Void')}
                </Button>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className={''}>
                    <DialogHeader>
                        <DialogTitle>{t('Hold Order')}</DialogTitle>
                        <DialogDescription className="sr-only">{t('Hold Order')}</DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-3">
                        <div className="w-full text-center text-3xl font-bold">{formatCurrency(form.data.total)}</div>
                        <div>
                            <Input
                                type="text"
                                placeholder={t('Order Reference')}
                                value={form.data.title || ''}
                                onChange={(e) => form.setData('title', e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="text-sm">
                            {t(
                                'The current order will be set on hold. You can retrieve this order from the pending order button. Providing a reference to it might help you to identify the order more quickly.',
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsOpen(false)} variant="outline" className="flex-1">
                            {t('Cancel')}
                        </Button>
                        <Button onClick={handleOnHold} variant="default" className="flex-1">
                            {t('Confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isVoidOpen} onOpenChange={setIsVoidOpen}>
                <DialogContent className={''}>
                    <DialogHeader>
                        <DialogTitle>{t('Void The Order')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {form?.data?.id && form?.data?.tendered > 0 ? t('Void The Order') : t('Order Deletion')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                        <div className="text-sm">
                            {form?.data?.id && form?.data?.tendered > 0
                                ? t(
                                      "The current order will be void. This will cancel the transaction, but the order won't be deleted. Further details about the operation will be tracked on the report. Consider providing the reason of this operation.",
                                  )
                                : t('The current order will be deleted as no payment has been made so far.')}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsVoidOpen(false)} variant="outline" className="flex-1">
                            {t('Cancel')}
                        </Button>
                        <Button onClick={handleOnVoid} variant="default" className="flex-1">
                            {t('Confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
