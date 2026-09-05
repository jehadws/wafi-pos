import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/utils/format';
import { useState } from 'react';
import { useTranslation } from '../../../lib/i18n';

type Props = {
  order: Order | null;
};

export default function OrderDetailsTab({ order }: Props) {
  const { t } = useTranslation();
  const [isRefundsOpen, setIsRefundsOpen] = useState(false);

  return (
    <>
      <div>
        <h3 className="mb-4 text-lg font-semibold">{t('Payment Summary')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="bg-muted flex items-center justify-between rounded border p-3">
              <span className="font-medium">{t('Sub Total')}</span>
              <span className="font-semibold">{formatCurrency(order?.subtotal || 0)}</span>
            </div>
            <div className="bg-primary/60 border-primary flex items-center justify-between rounded border p-3">
              <span className="font-medium">{t('Shipping')}</span>
              <span className="font-semibold">{formatCurrency(order?.shipping || 0)}</span>
            </div>
            <div className="bg-success/60 border-success flex items-center justify-between rounded border p-3">
              <span className="font-medium">{t('Total')}</span>
              <span className="font-semibold">{formatCurrency(order?.total || 0)}</span>
            </div>
            <div className="bg-danger/50 border-danger flex items-center justify-between rounded border p-3">
              <span className="font-medium">{t('Change')}</span>
              <span className="font-semibold">{formatCurrency(order?.change || 0)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-error/30 border-error/60 flex items-center justify-between rounded border p-3">
              <span className="font-medium">{t('Discount')}</span>
              <span className="font-semibold">{formatCurrency(order?.discount || 0)}</span>
            </div>
            <div className="bg-muted flex items-center justify-between rounded border p-3">
              <span className="font-medium">{t('Coupons')}</span>
              <span className="font-semibold">{formatCurrency(order?.total_coupons || 0)}</span>
            </div>
            <div className="bg-muted flex items-center justify-between rounded border p-3">
              <span className="font-medium">{t('Taxes')}</span>
              <span className="font-semibold">{formatCurrency(order?.tax_value || 0)}</span>
            </div>
            <div className="bg-info/60 border-info flex items-center justify-between rounded border p-3">
              <span className="font-medium">{t('Paid')}</span>
              <span className="font-semibold">{formatCurrency(order?.tendered || 0)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold">{t('Order Status')}</h3>
            <div className="space-y-3">
              <div className="bg-muted flex items-center justify-between rounded p-3">
                <span className="font-medium">{t('Customer')}</span>
                <span className="font-semibold">
                  {order?.customer.first_name} {order?.customer.last_name || ''}
                </span>
              </div>
              <div className="bg-muted flex items-center justify-between rounded p-3">
                <span className="font-medium">{t('Type')}</span>
                <span className="font-semibold">{t(order?.type || '')}</span>
              </div>
              <div className="bg-muted flex items-center justify-between rounded p-3">
                <span className="font-medium">{t('Delivery Status')}</span>
                <span className="font-semibold">
                  {order?.delivery_status === 'not-available' ? t('Not Available') : t(order?.delivery_status || '')}
                </span>
              </div>
              <div className="bg-muted flex items-center justify-between rounded p-3">
                <span className="font-medium">{t('Processing Status')}</span>
                <span className="font-semibold">
                  {order?.process_status === 'not-available' ? t('Not Available') : order?.process_status}
                </span>
              </div>
              <div className="bg-muted flex items-center justify-between rounded p-3">
                <span className="font-medium">{t('Payment Status')}</span>
                <span className="font-semibold">{t(order?.payment_status || '')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">{t('Products')}</h3>
            <div className="space-y-3">
              {order?.products?.map((product) => (
                <div key={product.id} className="bg-muted flex items-center justify-between rounded p-3">
                  <div>
                    <div className="font-medium">
                      {product.name} (x{product.quantity})
                    </div>
                    <div className="text-sm">{product.unit?.name}</div>
                  </div>
                  <span className="font-semibold">{formatCurrency(+(product.unit_price ?? 0) * +(product.quantity ?? 0))}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('Refund With Products')}</h3>
                <span
                  className="cursor-pointer text-sm font-medium underline hover:text-blue-600"
                  onClick={() => setIsRefundsOpen(true)}
                >
                  {t('All Refunds')}
                </span>
              </div>
              <div className="space-y-3">
                {(order as any)?.refunded_products?.slice(0, 3).map((product: any, index: number) => (
                  <div key={index} className="bg-muted flex items-center justify-between rounded p-3">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {product?.product?.name} (x{product?.quantity})
                      </div>
                      <div className="text-sm">
                        {product.unit.name} | <Badge variant="success">{product?.condition}</Badge>{' '}
                      </div>
                    </div>
                    <span className="font-semibold">{formatCurrency(product.total_price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isRefundsOpen} onOpenChange={setIsRefundsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('All Refunds')}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
              {!(order as any)?.refunded_products?.length ? (
              <div className="py-8 text-center text-sm">{t('Nothing to display')}</div>
            ) : (
              (order as any).refunded_products.map((product: any, index: number) => (
                <div key={index} className="bg-muted flex items-center justify-between rounded border p-3">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {product.product?.name} (x{product.quantity})
                    </div>
                    <div className="text-sm">
                      {product.unit?.name} | <Badge variant="success">{product.condition}</Badge>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-semibold">{formatCurrency(product.total_price)}</div>
                    <div className="text-muted-foreground text-xs">{product.created_at}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
