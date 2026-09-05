import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import PrintAgentService from '@/services/print-agent-service';
import { Order } from '@/types/models/order';
import { formatCurrency } from '@/utils/format';
import { ordersApi } from '@/api';
import { Eye, Loader2, Printer, Unlock } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import OrderProductCard from './order-product-card';

type Props = {
  order: TOrder;
  onOpenChange: (open: boolean) => void;
};



export default function OrderCard({ order, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { loadOrder } = usePOS();
  const [loading, setLoading] = useState(false);
  const [orderProducts, setOrderProducts] = useState<TOrderProducts[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const getOrderProducts = async (orderId: number) => {
    setLoading(true);
    try {
      const orderProducts = await ordersApi.getProducts(orderId);
      setOrderProducts(orderProducts);
    } catch (error) {
      console.error('Error fetching Order Products:', error);
    } finally {
      setLoading(false);
    }
  };

  const [isDirectPrinting, setIsDirectPrinting] = useState(false);

  const handlePrepareBeforePrint = async () => {
    setIsDirectPrinting(true);
    try {
      const productsList = (await ordersApi.getProducts(order.id)) || [];

      // Canonical receipt path — Order → FormattedReceiptData mapping and
      // printer configuration live in PrintAgentService (Subul branding).
      const receiptOrder = { ...order, products: productsList } as unknown as Order;
      const result = await PrintAgentService.printOrderReceipt(receiptOrder);

      if (result.success) {
        toast.success(t('Receipt sent to thermal printer.'));
      } else {
        toast.error(result.error || t('Failed to send print job to Print Agent.'));
      }
    } catch (error: any) {
      console.error('Direct print failed, showing browser fallback:', error);
      toast.error(error?.message || t('Failed to send print job to Print Agent.'));
    } finally {
      setIsDirectPrinting(false);
    }
  };

  const handleOpenOrder = async () => {
    try {
      onOpenChange(false);
      await loadOrder(order.id);
    } catch (error) {
      console.error('Error loading order:', error);
    }
  };

  return (
    <>
      <div ref={contentRef} />
      <div className="flex flex-col gap-2 border-b py-3">
        <div className="text-lg font-bold">{order.title}</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <div>
              <strong>{t('Order Code')}:</strong> {order.code}
            </div>
            <div>
              <strong>{t('Cashier')}:</strong> {order.user_username}
            </div>
            <div>
              <strong>{t('Total')}:</strong> {formatCurrency(order.total)}
            </div>
            <div>
              <strong>{t('Tendered')}:</strong> {formatCurrency(order.tendered)}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <strong>{t('Customer')}:</strong> {order.customer_first_name} {order.customer_last_name}
            </div>
            <div>
              <strong>{t('Date')}:</strong> {order.created_at}
            </div>
            <div>
              <strong>{t('Type')}:</strong> {order.type}
            </div>
          </div>
        </div>
        <div className="flex flex-row justify-end gap-2">
          <Button onClick={handleOpenOrder}>
            <Unlock className="h-3 w-3" />
            {t('Open')}
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              setIsOpen(true);
              getOrderProducts(order.id);
            }}
          >
            <Eye className="h-3 w-3" />
            {t('Products')}
          </Button>
          <Button variant={'destructive'} onClick={handlePrepareBeforePrint} disabled={isDirectPrinting}>
            {isDirectPrinting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
            {t('Print Direct')}
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={cn('flex h-[90vh] max-h-[90vh] w-[50vw] max-w-[50vw] flex-col sm:max-w-[50vw]')}>
          <DialogTitle>
            {t('Products')} - {order.code}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('Products')} - {order.code}
          </DialogDescription>
          {!loading && (
            <div className="min-h-[150px] flex-1">
              <div className="flex h-full flex-col gap-3">
                {orderProducts.map((orderProduct) => (
                  <OrderProductCard key={orderProduct.id} orderProduct={orderProduct} />
                ))}
              </div>
            </div>
          )}
          {loading && (
            <div className="flex min-h-[150px] flex-1 items-center justify-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
