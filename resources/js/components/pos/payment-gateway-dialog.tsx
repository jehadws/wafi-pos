import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { InertiaFormProps } from '@inertiajs/react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ConfirmationDialog from '../confirmation-dialog';
import { ScrollArea } from '../ui/scroll-area';
import { NumberPad } from './number-pad';
import { PaymentMethodSidebar } from './payment-method-sidebar';
import SummaryCard from './payment-summary-card';

export const PAYMENT_METHODS: Record<PaymentTypes, string> = {
    'cash-payment': 'Cash Payment',
    'bank-payment': 'Bank Payment',
    'customer-payment': 'Customer Payment',
} as const;

interface PaymentGatewayProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: InertiaFormProps<OrderFormValuesType>;
    useBillingAddress: boolean;
    useShippingAddress: boolean;
    resetCart: () => void;
}

export function PaymentGatewayDialog({ open, onOpenChange, form, useShippingAddress, useBillingAddress, resetCart }: PaymentGatewayProps) {
    const { t } = useTranslation();
    const [tab, setTab] = useState<PaymentTypes | 'payment-list'>('cash-payment');
    const [screenValue, setScreenValue] = useState('0.00');
    const [rawValue, setRawValue] = useState(0);
    const [isSaveAsUnpaidOpen, setIsSaveAsUnpaidOpen] = useState(false);
    const [isConfirmFullPaymentOpen, setIsConfirmFullPaymentOpen] = useState(false);

    const paid = form.data.payments.reduce((sum, p) => sum + p.value, 0);
    const total = form.data.total;
    const change = form.data.change;

    const handleNumberInput = (digit: string) => {
        if (!/^\d$/.test(digit)) return; // ignore anything not 0-9

        const newRaw = rawValue * 10 + parseInt(digit, 10);
        setRawValue(newRaw);

        // Convert cents to decimal string
        const newFormatted = (newRaw / 100).toFixed(2);
        setScreenValue(newFormatted);
    };

    const handleBackspace = () => {
        const newRaw = Math.floor(rawValue / 10);
        setRawValue(newRaw);
        setScreenValue((newRaw / 100).toFixed(2));
    };

    const handleFullPayment = (paymentType: PaymentTypes) => {
        if (total <= paid) return;
        const payment: TPaymentMethod = {
            identifier: paymentType,
            value: total - paid,
            label: PAYMENT_METHODS[paymentType],
            selected: false,
            readonly: false,
        };

        form.setData('payments', [...form.data.payments, payment]);
        setScreenValue('0.00');
        setRawValue(0);
    };

    const handleConfirmPayment = (paymentType: PaymentTypes) => {
        const amount = Number.parseFloat(screenValue);
        if (amount <= 0) return;
        const payment: TPaymentMethod = {
            identifier: paymentType,
            value: amount,
            label: PAYMENT_METHODS[paymentType],
            selected: false,
            readonly: false,
        };
        form.setData('payments', [...form.data.payments, payment]);
        setScreenValue('0.00');
        setRawValue(0);
    };

    const handleRemovePayment = (identifier: string, value: number) => {
        const payments = [...form.data.payments];
        const index = payments.findIndex((item) => item.identifier === identifier && item.value === value);

        if (index !== -1) {
            payments.splice(index, 1);
            form.setData('payments', payments);
        }
    };

    const onTabSelect = (method: PaymentTypes | 'payment-list') => {
        setTab(method);
        setScreenValue('0.00');
    };

    const handleUpdate = async () => {
        if (form.data.id) {
            try {
                const res = await axios.put(`/api/orders/${form.data.id}`, {
                    ...form.data,
                    payment_status: 'unpaid',
                    customer: {
                        ...form.data.customer,
                        selected: true,
                    },
                    addresses: {
                        billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
                        shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
                    },
                });

                if (res.data) {
                    toast.success(t('The operation was successful.'));
                    resetCart();
                }
            } catch (error) {
                console.log(error);
                toast.error(t('An unexpected error occurred'));
            }
        } else {
            try {
                const res = await axios.put('/api/orders', {
                    ...form.data,
                    payment_status: 'unpaid',
                    customer: {
                        ...form.data.customer,
                        selected: true,
                    },
                    addresses: {
                        billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
                        shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
                    },
                });
                if (res.data) {
                    toast.success(t('The operation was successful.'));
                    resetCart();
                }
            } catch (error) {
                console.log(error);
                toast.error(t('An unexpected error occurred'));
            }
        }
    };

    const handleLayaway = () => {
        // payment_status : "unpaid"
        console.log('Payment layaway:', {
            ...form.data,
        });

        toast.success(t('Partially paid orders are disabled.'));
    };

    const handleSaveAsUnpaid = async () => {
        // payment_status : "unpaid"
        if (form.data.id) {
            try {
                const res = await axios.put(`/api/orders/${form.data.id}`, {
                    ...form.data,
                    customer: {
                        ...form.data.customer,
                        selected: true,
                    },
                    addresses: {
                        billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
                        shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
                    },
                });

                if (res.data) {
                    toast.success(t('The operation was successful.'));
                    resetCart();
                }
            } catch (error) {
                console.log(error);
                toast.error(t('An unexpected error occurred'));
            }
        } else {
            try {
                const res = await axios.post('/api/orders', {
                    ...form.data,
                    customer: {
                        ...form.data.customer,
                        selected: true,
                    },
                    addresses: {
                        billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
                        shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
                    },
                });

                if (res.data) {
                    toast.success(t('The operation was successful.'));
                    resetCart();
                }
            } catch (error) {
                console.log(error);
                toast.error(t('An unexpected error occurred'));
            }
        }
    };

    const handleSubmitPayment = async () => {
        if (form.data.id) {
            try {
                const res = await axios.put(`/api/orders/${form.data.id}`, {
                    ...form.data,
                    customer: {
                        ...form.data.customer,
                        selected: true,
                    },
                    payment_status: 'paid',
                    addresses: {
                        billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
                        shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
                    },
                });

                if (res.data) {
                    toast.success(t('The operation was successful.'));
                    resetCart();
                }
            } catch (error) {
                console.log(error);
                toast.error(t('An unexpected error occurred'));
            }
        } else {
            try {
                const res = await axios.post('/api/orders', {
                    ...form.data,
                    customer: {
                        ...form.data.customer,
                        selected: true,
                    },
                    payment_status: 'paid',
                    addresses: {
                        billing: useBillingAddress ? form.data?.customer?.billing : form.data?.addresses?.billing,
                        shipping: useShippingAddress ? form.data?.customer?.shipping : form.data?.addresses?.shipping,
                    },
                });

                if (res.data) {
                    toast.success(t('The operation was successful.'));
                    resetCart();
                }
            } catch (error) {
                console.log(error);
                toast.error(t('An unexpected error occurred'));
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn('bg-card flex h-[90vh] max-h-[90vh] w-[95vw] max-w-[95vw] flex-col gap-0 p-0 sm:max-w-[95vw]')}>
                <DialogTitle className="sr-only">{t('Payment Gateway')}</DialogTitle>
                <DialogDescription className="sr-only">{t('Payment Gateway')}</DialogDescription>
                {/* Header */}
                <div className="border-border flex items-center justify-between border-b p-4">
                    <h2 className="text-foreground text-lg font-semibold">
                        {t('Payment Gateway')} : {tab === 'payment-list' ? t('List Of Payments') : t('Payment Gateway')}
                    </h2>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar */}
                    <PaymentMethodSidebar selectedTab={tab} onTabSelect={onTabSelect} totalPayment={form.data.payments.length} />
                    <div className="flex-1">
                        {/* Main Content */}
                        {tab !== 'payment-list' && (
                            <div className="flex-1 space-y-6 p-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <SummaryCard label={t('Total')} amount={form.data.total} variant="total" />
                                    <SummaryCard label={t('Discount')} amount={form.data.discount} variant="discount" />
                                    <SummaryCard label={t('Paid')} amount={paid} variant="paid" />
                                    <SummaryCard label={t('Change')} amount={change} variant="change" isNegative={true} />
                                </div>

                                {/* Screen Display */}
                                <div className="border-border rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground font-medium">{t('Screen')} :</span>
                                        <span className="text-foreground text-2xl font-bold">
                                            {formatCurrency(Number.parseFloat(screenValue) || 0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Number Pad */}
                                <NumberPad
                                    onNumberClick={handleNumberInput}
                                    onBackspace={handleBackspace}
                                    onConfirm={() => handleConfirmPayment(tab)}
                                    handleFullPayment={() => setIsConfirmFullPaymentOpen(true)}
                                />
                            </div>
                        )}

                        {tab === 'payment-list' && (
                            <ScrollArea className="h-full min-h-[150px]">
                                <div className="flex-1 space-y-2 p-3">
                                    {form.data.payments.map((payment, index) => (
                                        <div key={index} className="border-border bg-background/20 rounded-lg border px-4 py-2">
                                            <div className="flex items-center gap-4">
                                                <span className="text-foreground flex-1">{payment.label}</span>
                                                <span className="text-foreground font-bold">{formatCurrency(payment.value)}</span>
                                                <Button
                                                    variant={'outline'}
                                                    size={'icon'}
                                                    className="hover:cursor-pointer"
                                                    onClick={() => handleRemovePayment(payment.identifier, payment.value)}
                                                >
                                                    <Trash2 className="text-destructive h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-border flex justify-end gap-4 border-t p-4">
                    {form.data.tendered > 0 && form.data.tendered < form.data.total && (
                        <Button
                            onClick={handleUpdate}
                            className="bg-blue-600 px-6 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                            {t('Edit')}
                        </Button>
                    )}
                    {form.data.tendered === 0 && (
                        <>
                            <Button
                                onClick={handleLayaway}
                                className="bg-blue-600 px-6 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                                {t('Layaway')} - {formatCurrency(form.data.tendered)}
                            </Button>
                            <Button
                                onClick={() => setIsSaveAsUnpaidOpen(true)}
                                className="bg-blue-600 px-6 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                                {t('Unpaid')}
                            </Button>
                        </>
                    )}

                    {form.data.tendered >= form.data.total && (
                        <Button
                            onClick={() => handleSubmitPayment()}
                            className="bg-green-600 px-6 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                        >
                            {t('Submit Payment')}
                        </Button>
                    )}
                </div>

                <ConfirmationDialog
                    isOpen={isSaveAsUnpaidOpen}
                    onClose={() => setIsSaveAsUnpaidOpen(false)}
                    onConfirm={() => {
                        handleSaveAsUnpaid();
                        setIsSaveAsUnpaidOpen(false);
                    }}
                    title={t('Unpaid')}
                    description={t('Would you like to save this order as unpaid?')}
                />

                <ConfirmationDialog
                    isOpen={isConfirmFullPaymentOpen}
                    onClose={() => setIsConfirmFullPaymentOpen(false)}
                    onConfirm={() => {
                        handleFullPayment(tab as PaymentTypes);
                        setIsConfirmFullPaymentOpen(false);
                    }}
                    title={t('Confirm Full Payment')}
                    description={t('A full payment will be made using {paymentType} for {total}', {
                        paymentType: PAYMENT_METHODS[tab as PaymentTypes],
                        total: formatCurrency(form.data.total),
                    })}
                />
            </DialogContent>
        </Dialog>
    );
}
