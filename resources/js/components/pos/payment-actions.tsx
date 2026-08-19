import { Button } from '@/components/ui/button';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { ordersApi } from '@/api';
import { CreditCard, PauseCircle, Percent, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';

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
    if (!order.customer || !order.customer_id || !order.type) {
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
      console.log(error);
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
            if (order.tendered > 0) {
              return toast.error(t('Unable to hold an order which payment status has been updated already.'));
            }

            if (!products.length) {
              toast.error(t('You need to provide some products before proceeding.'));
              return;
            }
            if (!order.customer || !order.customer_id || !order.type) {
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
            if (!order.id) {
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
