import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Order } from '@/types/models/order';
import { formatCurrency } from '@/utils/format';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { submitAndFinalizeOrder } from '@/services/order-finalize';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NumberPad } from './number-pad';
import { PaymentMethodSidebar } from './payment-method-sidebar';
import SummaryCard from './payment-summary-card';

import { PaymentType } from '@/types/models/payment-type';

interface TPaymentMethod {
  identifier: string;
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
  const { order, products, submitOrder, addPayment, removePayment, options, paymentsType } = usePOS();
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<PaymentType | 'payment-list'>(
    paymentsType[0] ?? 'payment-list',
  );
  const [screenValue, setScreenValue] = useState('0.00');
  const [rawValue, setRawValue] = useState(0);

  // Parse amount shortcuts from options
  const amountShortcuts: number[] = (() => {
    const raw = options[POS_OPTION_KEYS.amountShortcut];
    if (!raw) return [];
    const str = typeof raw === 'string' ? raw : String(raw);
    return str.split(',').map((s: string) => parseFloat(s.trim())).filter((n: number) => !isNaN(n) && n > 0);
  })();

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

  const handleAmountShortcut = (amount: number) => {
    const cents = Math.round(amount * 100);
    setRawValue(cents);
    setScreenValue(amount.toFixed(2));
  };

  const handleFullPayment = (method: PaymentType) => {
    if (total <= paid) return;
    const payment: TPaymentMethod = {
      identifier: method.identifier,
      value: total - paid,
      label: method.label,
      selected: false,
      readonly: false,
    };
    addPayment(payment as any);
    setScreenValue('0.00');
    setRawValue(0);
  };

  const handleConfirmPayment = (method: PaymentType) => {
    const amount = Number.parseFloat(screenValue);
    if (amount <= 0) return;
    const payment: TPaymentMethod = {
      identifier: method.identifier,
      value: amount,
      label: method.label,
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

  const onTabSelect = (method: PaymentType | 'payment-list') => {
    setSelectedMethod(method);
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

    await submitAndFinalizeOrder({
      order,
      orderData: orderData as Order,
      products,
      submitOrder,
      printOrderReceipt: (receiptOrder) => usePOS.getState().printOrderReceipt(receiptOrder),
      resetCart,
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleSaveAsUnpaid = async () => {
    await handleSubmitOrder('unpaid');
  };

  const handleSubmitPayment = async () => {
    await handleSubmitOrder('paid');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Mockup-style slide-in payment panel: full-height side sheet (~42% on
          desktop, near-full on small screens). Same content and handlers as
          the previous centered dialog — only the container changed. */}
      <SheetContent
        side="right"
        className={cn(
          'bg-card flex h-full flex-col gap-0 overflow-hidden p-0',
          'w-full sm:w-[85%] sm:max-w-none lg:w-[42%] lg:min-w-[420px]',
        )}
      >
        <SheetTitle className="sr-only">{t('Payment Gateway')}</SheetTitle>
        <SheetDescription className="sr-only">{t('Payment Gateway')}</SheetDescription>
        <div className="border-border flex items-center justify-between border-b p-4 pe-14">
          <h2 className="text-foreground text-lg font-semibold">
            {t('Payment Gateway')} : {selectedMethod === 'payment-list' ? t('List Of Payments') : t('Payment Gateway')}
          </h2>
        </div>

        {/* Method rail stacks above the keypad on narrow sheets */}
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <PaymentMethodSidebar selectedTab={selectedMethod} onTabSelect={onTabSelect} totalPayment={payments.length} paymentsType={paymentsType} />
          <div className="min-w-0 flex-1">
            {selectedMethod !== 'payment-list' && (
              <div className="flex-1 space-y-6 overflow-y-auto p-4 lg:p-6">
                <div className="grid grid-cols-2 gap-4">
                  <SummaryCard label={t('Total')} amount={total} variant="total" />
                  <SummaryCard label={t('Discount')} amount={order.discount || 0} variant="discount" />
                  <SummaryCard label={t('Paid')} amount={paid} variant="paid" />
                  <SummaryCard label={t('Change')} amount={change} variant="change" isNegative={true} />
                </div>

                <div className="border-border bg-muted/40 rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">{t('Screen')} :</span>
                    <span className="text-foreground text-2xl font-bold tabular-nums">
                      {formatCurrency(Number.parseFloat(screenValue) || 0)}
                    </span>
                  </div>
                </div>

                {amountShortcuts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {amountShortcuts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        className="bg-card h-11 min-w-16 rounded-full font-semibold shadow-2xs"
                        onClick={() => handleAmountShortcut(amount)}
                      >
                        {formatCurrency(amount)}
                      </Button>
                    ))}
                  </div>
                )}

                <NumberPad
                  onNumberClick={handleNumberInput}
                  onBackspace={handleBackspace}
                  onConfirm={() => handleConfirmPayment(selectedMethod)}
                  handleFullPayment={() => {
                    if ('identifier' in selectedMethod) {
                      handleFullPayment(selectedMethod);
                    }
                  }}
                />
              </div>
            )}

            {selectedMethod === 'payment-list' && (
              <ScrollArea className="h-full min-h-[150px]">
                <div className="flex-1 space-y-2 p-3">
                  {payments.map((payment: any, index: number) => (
                    <div key={index} className="border-border bg-muted/30 rounded-lg border px-4 py-2">
                      <div className="flex items-center gap-4">
                        <span className="text-foreground flex-1">{payment.label}</span>
                        <span className="text-foreground font-bold tabular-nums">{formatCurrency(payment.value)}</span>
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
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 text-sm font-semibold"
            >
              {t('Edit')}
            </Button>
          )}
          {order.tendered === 0 && options[POS_OPTION_KEYS.allowUnpaid] !== 'no' && (
            <>
              <Button
                onClick={() => handleSaveAsUnpaid()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 text-sm font-semibold"
              >
                {t('Unpaid')}
              </Button>
            </>
          )}

          {order.tendered >= total && (
            <Button
              onClick={() => handleSubmitPayment()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 text-sm font-semibold"
            >
              {t('Submit Payment')}
            </Button>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}
