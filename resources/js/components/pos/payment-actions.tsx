import { ordersApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { CreditCard, PauseCircle, Percent, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  setShowPaymentGatewayDialog: (value: boolean) => void;
  onOpenSelectCustomerDialog: () => void;
  onOpenOrderTypeDialog: () => void;
  useBillingAddress: boolean;
  useShippingAddress: boolean;
  resetCart: () => void;
  onOpenDiscountDialog: () => void;
  holdDialogOpen: boolean;
  onHoldDialogOpenChange: (open: boolean) => void;
};

export default function PaymentActions({
  onOpenDiscountDialog,
  onOpenSelectCustomerDialog,
  onOpenOrderTypeDialog,
  setShowPaymentGatewayDialog,
  useBillingAddress,
  useShippingAddress,
  resetCart,
  holdDialogOpen,
  onHoldDialogOpenChange,
}: Props) {
  const { order, products, submitOrder } = usePOS();
  const { t } = useTranslation();
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [holdTitle, setHoldTitle] = useState('');

  const ensureCheckoutPrerequisites = () => {
    if (!products.length) {
      toast.error(t('You need to provide some products before proceeding'));
      return false;
    }
    // Fallback gates only — with a walk-in default customer configured and
    // order-type auto-selection these are already satisfied before Pay.
    if (!order.customer || !order.customer_id) {
      toast.warning(t('Please select a customer before proceeding to payment'));
      onOpenSelectCustomerDialog();
      return false;
    }
    if (!order.type) {
      toast.warning(t('Please select an order type before proceeding to payment'));
      onOpenOrderTypeDialog();
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!ensureCheckoutPrerequisites()) return;
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
      onHoldDialogOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message || t('Something went wrong. Please try again'));
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
    } catch {
      toast.error(t('Something went wrong. Please try again'));
    }
  };

  return (
    <>
      <div className={cn('grid grid-cols-4 border-t')}>
        <Button
          className={cn(
            'group relative flex h-16 flex-col items-center justify-center gap-0.5 rounded-none border-e font-semibold transition-all duration-150',
            'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]',
            'col-span-1 shadow-sm',
          )}
          onClick={handleSubmit}
          type="button"
        >
          <div className="flex items-center gap-1.5 text-sm leading-none">
            <CreditCard className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>{t('Pay')}</span>
          </div>
          <span className="text-xs font-bold tracking-wide opacity-95">{formatCurrency(order.total || 0)}</span>
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
              onOpenSelectCustomerDialog();
              return;
            }
            if (!order.type) {
              toast.warning(t('Please select an order type before holding the order'));
              onOpenOrderTypeDialog();
              return;
            }

            onHoldDialogOpenChange(true);
          }}
          className={cn(
            'group flex h-14 flex-col items-center justify-center gap-0.5 rounded-none border-e transition-all duration-150',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]',
            'col-span-1 shadow-sm',
          )}
          type="button"
        >
          <div className="flex items-center gap-1.5 text-sm leading-none font-semibold">
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
          <div className="flex items-center gap-1.5 text-sm leading-none font-semibold">
            <Percent className="text-muted-foreground h-4 w-4 transition-transform group-hover:scale-110" />
            <span>{t('Discount')}</span>
          </div>
          <span className="text-muted-foreground text-[11px]">{order.discount ? `-${formatCurrency(order.discount)}` : t('Add Promo')}</span>
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
          <div className="flex items-center gap-1.5 text-sm leading-none font-semibold">
            <XCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>{t('Void')}</span>
          </div>
          <span className="text-[11px] opacity-80">{t('Cancel Order')}</span>
        </Button>
      </div>
      <Dialog open={holdDialogOpen} onOpenChange={onHoldDialogOpenChange}>
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
            <Button onClick={() => onHoldDialogOpenChange(false)} variant="outline" className="flex-1">
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
            <DialogDescription className="sr-only">{order?.id && order?.tendered > 0 ? t('Void The Order') : t('Order Deletion')}</DialogDescription>
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
