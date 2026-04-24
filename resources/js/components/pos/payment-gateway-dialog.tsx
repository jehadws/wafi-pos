import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ConfirmationDialog from '../confirmation-dialog';
import { ScrollArea } from '../ui/scroll-area';
import { NumberPad } from './number-pad';
import { PaymentMethodSidebar } from './payment-method-sidebar';
import SummaryCard from './payment-summary-card';

export type PaymentTypes = 'cash-payment' | 'bank-payment' | 'customer-payment';

export const PAYMENT_METHODS: Record<PaymentTypes, string> = {
    'cash-payment': 'Cash Payment',
    'bank-payment': 'Bank Payment',
    'customer-payment': 'Customer Payment',
} as const;

interface TPaymentMethod {
    identifier: PaymentTypes;
    value: number;
    label: string;
    selected: boolean;
    readonly: boolean;
}

interface PaymentGatewayProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    useBillingAddress: boolean;
    useShippingAddress: boolean;
    resetCart: () => void;
}

export function PaymentGatewayDialog({ open, onOpenChange, useShippingAddress, useBillingAddress, resetCart }: PaymentGatewayProps) {
    const { order, products, submitOrder, addPayment, removePayment, reset } = usePOS();
    const { t } = useTranslation();
    const [tab, setTab] = useState<PaymentTypes | 'payment-list'>('cash-payment');
    const [screenValue, setScreenValue] = useState('0.00');
    const [rawValue, setRawValue] = useState(0);
    const [isSaveAsUnpaidOpen, setIsSaveAsUnpaidOpen] = useState(false);
    const [isConfirmFullPaymentOpen, setIsConfirmFullPaymentOpen] = useState(false);

    const payments = order.payments || [];
    const paid = payments.reduce((sum: number, p: any) => sum + p.value, 0);
    const total = order.total || 0;
    const change = order.tendered > paid ? order.tendered - total : 0;

    const handleNumberInput = (digit: string) => {
        if (!/^\d$/.test(digit)) return;
        const newRaw = rawValue * 10 + parseInt(digit, 10);
        setRawValue(newRaw);
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
        addPayment(payment as any);
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
        addPayment(payment as any);
        setScreenValue('0.00');
        setRawValue(0);
    };

    const handleRemovePayment = (identifier: string, value: number) => {
        const payment = payments.find((p: any) => p.identifier === identifier && p.value === value);
        if (payment) {
            removePayment(payment);
        }
    };

    const onTabSelect = (method: PaymentTypes | 'payment-list') => {
        setTab(method);
        setScreenValue('0.00');
    };

    const handleSubmitOrder = async (paymentStatus: string = 'paid') => {
        const orderData = {
            ...order,
            payment_status: paymentStatus,
            customer: {
                ...order.customer,
                selected: true,
            },
            addresses: {
                billing: useBillingAddress ? order.customer?.billing : order.addresses?.billing,
                shipping: useShippingAddress ? order.customer?.shipping : order.addresses?.shipping,
            },
        };

        try {
            await submitOrder(orderData);
            toast.success(t('The operation was successful.'));
            resetCart();
            onOpenChange(false);
        } catch (error: any) {
            console.log(error);
            toast.error(error?.message || t('An unexpected error occurred'));
        }
    };

    const handleSaveAsUnpaid = async () => {
        await handleSubmitOrder('unpaid');
    };

    const handleSubmitPayment = async () => {
        await handleSubmitOrder('paid');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn('bg-card flex h-[90vh] max-h-[90vh] w-[95vw] max-w-[95vw] flex-col gap-0 p-0 sm:max-w-[95vw]')}>
                <DialogTitle className="sr-only">{t('Payment Gateway')}</DialogTitle>
                <DialogDescription className="sr-only">{t('Payment Gateway')}</DialogDescription>
                <div className="border-border flex items-center justify-between border-b p-4">
                    <h2 className="text-foreground text-lg font-semibold">
                        {t('Payment Gateway')} : {tab === 'payment-list' ? t('List Of Payments') : t('Payment Gateway')}
                    </h2>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <PaymentMethodSidebar selectedTab={tab} onTabSelect={onTabSelect} totalPayment={payments.length} />
                    <div className="flex-1">
                        {tab !== 'payment-list' && (
                            <div className="flex-1 space-y-6 p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <SummaryCard label={t('Total')} amount={total} variant="total" />
                                    <SummaryCard label={t('Discount')} amount={order.discount || 0} variant="discount" />
                                    <SummaryCard label={t('Paid')} amount={paid} variant="paid" />
                                    <SummaryCard label={t('Change')} amount={change} variant="change" isNegative={true} />
                                </div>

                                <div className="border-border rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground font-medium">{t('Screen')} :</span>
                                        <span className="text-foreground text-2xl font-bold">
                                            {formatCurrency(Number.parseFloat(screenValue) || 0)}
                                        </span>
                                    </div>
                                </div>

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
                                    {payments.map((payment: any, index: number) => (
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

                <div className="border-border flex justify-end gap-4 border-t p-4">
                    {order.tendered > 0 && order.tendered < total && (
                        <Button
                            onClick={() => handleSubmitOrder('partially_paid')}
                            className="bg-blue-600 px-6 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                            {t('Edit')}
                        </Button>
                    )}
                    {order.tendered === 0 && (
                        <>
                            <Button
                                onClick={() => setIsSaveAsUnpaidOpen(true)}
                                className="bg-blue-600 px-6 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                                {t('Unpaid')}
                            </Button>
                        </>
                    )}

                    {order.tendered >= total && (
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
                        total: formatCurrency(total),
                    })}
                />
            </DialogContent>
        </Dialog>
    );
}
