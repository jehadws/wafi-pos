import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import PrintAgentService from '@/services/print-agent-service';
import { formatCurrency } from '@/utils/format';
import { InvoiceTemplate } from '@/utils/print';
import { ordersApi } from '@/api';
import { Eye, Loader2, Printer, Unlock } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import OrderProductCard from './order-product-card';

type Props = {
  order: TOrder;
  onOpenChange: (open: boolean) => void;
};

type POSResponse = {
  id: number;
  description: null | string;
  code: string;
  title: string;
  type: 'takeaway' | 'delivery';
  payment_status: 'hold' | 'paid' | 'not-available' | 'unpaid';
  process_status: 'not-available';
  delivery_status: 'not-available';
  discount: number;
  discount_type: 'flat' | 'percentage';
  support_instalments: boolean;
  discount_percentage: number;
  shipping: number;
  shipping_rate: number;
  shipping_type: null | 'flat' | 'percentage';
  total_without_tax: number;
  subtotal: number;
  total_with_tax: number;
  total_coupons: number;
  total_cogs: number;
  total: number;
  tax_value: number;
  products_tax_value: number;
  tax_group_id: null | number;
  tax_type: '0';
  tendered: number;
  change: number;
  final_payment_date: null | string;
  total_instalments: number;
  customer_id: number;
  note: null | string;
  note_visibility: 'hidden' | 'visible';
  author: number;
  uuid: null | string;
  register_id: null | number;
  voidance_reason: null | string;
  created_at: string;
  updated_at: string;
  payments: TPaymentMethod[];
  shipping_address: Address;
  billing_address: Address;
  taxes: Tax[];
  instalments: [];
  coupons: Coupon[];
  products: {
    id: number;
    name: string;
    unit_name: string;
    mode: 'normal';
    product_type: 'materialized' | 'dematerialized' | 'grouped';
    product_id: number;
    order_id: number;
    unit_id: number;
    unit_quantity_id: number;
    product_category_id: number;
    procurement_product_id: null | number;
    tax_group_id: number;
    tax_type: 'exclusive' | 'inclusive';
    uuid: null | string;
    status: 'sold';
    return_observations: null;
    return_condition: null;
    discount_type: 'percentage' | 'flat';
    discount: number;
    quantity: number;
    discount_percentage: number;
    unit_price: number;
    price_with_tax: number;
    price_without_tax: number;
    wholesale_tax_value: number;
    sale_tax_value: number;
    tax_value: number;
    rate: number;
    total_price: number;
    total_price_with_tax: number;
    total_price_without_tax: number;
    total_purchase_price: number;
    created_at: string;
    updated_at: string;
    product: Product & {
      tax_group: TaxGroup & {
        taxes: Tax[];
      };
      unit_quantities: UnitQuantity[];
    };
    unit: Unit;
  }[];
  customer: Customer & {
    billing: Address;
    shipping: Address;
  };
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

      // Format for direct ESC/POS thermal printing
      await PrintAgentService.printReceipt({
        storeName: 'JGREM POS',
        orderCode: order.code,
        date: order.created_at,
        cashier: order.user_username,
        customer: `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim() || undefined,
        orderType: order.type,
        items: productsList.map((p: any) => ({
          name: p.name,
          quantity: p.quantity,
          price: formatCurrency(p.price_with_tax || p.unit_price),
          total: formatCurrency(p.total_price_with_tax || p.total_price),
        })),
        subtotal: formatCurrency(order.subtotal),
        discount: order.discount > 0 ? formatCurrency(order.discount) : undefined,
        tax: order.tax_value > 0 ? formatCurrency(order.tax_value) : undefined,
        total: formatCurrency(order.total),
        tendered: formatCurrency(order.tendered),
        change: formatCurrency(order.change),
        barcode: order.code,
      });

      toast.success(t('Receipt sent to thermal printer.'));
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
