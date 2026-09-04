import { Button } from '@/components/ui/button';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { ordersApi } from '@/api';
import { CreditCard, PauseCircle, Percent, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Props = {
  setShowPaymentGatewayDialog: (value: boolean) => void;
  useBillingAddress: boolean;
  useShippingAddress: boolean;
  resetCart: () => void;
  setShouldValidate: (value: boolean) => void;
  onOpenDiscountDialog: () => void;
};

export default function PaymentActions({
  onOpenDiscountDialog,
  setShouldValidate,
  setShowPaymentGatewayDialog,
  useBillingAddress,
  useShippingAddress,
  resetCart,
}: Props) {
  const { order, products, submitOrder, reset } = usePOS();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [holdTitle, setHoldTitle] = useState('');

  const handleSubmit = () => {
    if (!products.length) {
      toast.error(t('You need to provide some products before proceeding'));
      return;
    }
    if (!order.customer || !order.customer_id) {
      toast.warning(t('Please select a customer before proceeding to payment'));
      setShouldValidate(true);
      return;
    }
    if (!order.type) {
      toast.warning(t('Please select an order type before proceeding to payment'));
      setShouldValidate(true);
      return;
    }
    setShowPaymentGatewayDialog(true);
  };

  const handleOnHold = async () => {
    try {
      const orderData = {
        ...order,
        title: holdTitle,
        customer: {
          ...order.customer,
          selected: true,
        },
        payment_status: 'hold',
        addresses: {
          billing: useBillingAddress ? order.customer?.billing : order.addresses?.billing,
          shipping: useShippingAddress ? order.customer?.shipping : order.addresses?.shipping,
        },
      };

      await submitOrder(orderData);
      toast.success(t('Order Placed as On Hold'));
      resetCart();
      setHoldTitle('');
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error?.message || t('Something went wrong. Please try again'));
    }
  };

  const handleOnVoid = async () => {
    if (!order.id) return toast.error(t('Unable to void an unpaid order.'));
    try {
      const result = await ordersApi.void(order.id, { reason: '' });

      if (result) {
        toast.success(t('The order has been deleted.'));
        resetCart();
        setIsVoidOpen(false);
      }
    } catch (error) {
      toast.error(t('Something went wrong. Please try again'));
    }
  };

  return (
    <>
      <div className="grid grid-cols-4 border-t">
        <Button
          className={cn(
            'group relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-none border-e font-semibold transition-all duration-150',
            'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-500',
            'col-span-1 shadow-sm',
          )}
          onClick={handleSubmit}
          type="button"
        >
          <div className="flex items-center gap-1.5 text-sm leading-none">
            <CreditCard className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>{t('Pay')}</span>
          </div>
          <span className="text-xs font-bold tracking-wide opacity-95">
            {formatCurrency(order.total || 0)}
          </span>
        </Button>
        <Button
          onClick={() => {
            if (order.tendered > 0) {
              return toast.error(t('Unable to hold an order which payment status has been updated already.'));
            }

            if (!products.length) {
              toast.error(t('You need to provide some products before proceeding.'));
              return;
            }
            if (!order.customer || !order.customer_id) {
              toast.warning(t('Please select a customer before holding the order'));
              setShouldValidate(true);
              return;
            }
            if (!order.type) {
              toast.warning(t('Please select an order type before holding the order'));
              setShouldValidate(true);
              return;
            }

            setIsOpen(true);
          }}
          className={cn(
            'group flex h-14 flex-col items-center justify-center gap-0.5 rounded-none border-e transition-all duration-150',
            'bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.98] dark:bg-sky-700 dark:hover:bg-sky-600',
            'col-span-1 shadow-sm',
          )}
          type="button"
        >
          <div className="flex items-center gap-1.5 text-sm font-semibold leading-none">
            <PauseCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>{t('Hold')}</span>
          </div>
          <span className="text-[11px] opacity-85">{t('Save Order')}</span>
        </Button>
        <Button
          className={cn(
            'group flex h-14 flex-col items-center justify-center gap-0.5 rounded-none border-e transition-all duration-150',
            'bg-muted/70 text-foreground hover:bg-muted active:scale-[0.98]',
            'col-span-1',
          )}
          variant="ghost"
          type="button"
          onClick={onOpenDiscountDialog}
        >
          <div className="flex items-center gap-1.5 text-sm font-semibold leading-none">
            <Percent className="h-4 w-4 text-amber-500 transition-transform group-hover:scale-110" />
            <span>{t('Discount')}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {order.discount ? `-${formatCurrency(order.discount)}` : t('Add Promo')}
          </span>
        </Button>
        <Button
          className={cn(
            'group flex h-14 flex-col items-center justify-center gap-0.5 rounded-none transition-all duration-150',
            'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground active:scale-[0.98]',
            'col-span-1',
          )}
          variant="ghost"
          type="button"
          onClick={() => {
            if (!order.id) {
              toast.error(t('Unable to void an unpaid order.'));
              return;
            }

            setIsVoidOpen(true);
          }}
        >
          <div className="flex items-center gap-1.5 text-sm font-semibold leading-none">
            <XCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>{t('Void')}</span>
          </div>
          <span className="text-[11px] opacity-80">{t('Cancel Order')}</span>
        </Button>
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={''}>
          <DialogHeader>
            <DialogTitle>{t('Hold Order')}</DialogTitle>
            <DialogDescription className="sr-only">{t('Hold Order')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="w-full text-center text-3xl font-bold">{formatCurrency(order.total)}</div>
            <div>
              <Input
                type="text"
                placeholder={t('Order Reference')}
                value={holdTitle}
                onChange={(e) => setHoldTitle(e.target.value)}
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
              {order?.id && order?.tendered > 0 ? t('Void The Order') : t('Order Deletion')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="text-sm">
              {order?.id && order?.tendered > 0
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
