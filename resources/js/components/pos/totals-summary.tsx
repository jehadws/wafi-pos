import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import { ChevronRight, Percent, Tag, Truck, User } from 'lucide-react';

interface TotalsSummaryProps {
  subtotal: number;
  tax: number;
  discount: number;
  totalCoupons: number;
  total: number;
  shipping: number;
  customer: Customer | null | undefined;
  orderType: OrderTypeObj | null | undefined;
  onOpenDiscountDialog: () => void;
  onOpenShippingDialog: () => void;
  onOpenOrderTypeDialog: () => void;
  onOpenSelectCustomerDialog: () => void;
}

export default function TotalsSummary({
  subtotal,
  orderType,
  tax,
  shipping,
  discount,
  totalCoupons,
  total,
  customer,
  onOpenDiscountDialog,
  onOpenShippingDialog,
  onOpenOrderTypeDialog,
  onOpenSelectCustomerDialog,
}: TotalsSummaryProps) {
  const { t } = useTranslation();

  const customerName = customer
    ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.name || t('Customer')
    : t('Select Customer');

  return (
    <div className="bg-card/95 border-t shadow-sm">
      {/* Quick Context Strip: Customer & Order Type */}
      <div className="bg-muted/30 grid grid-cols-2 divide-x divide-border border-b text-xs">
        <button
          type="button"
          onClick={onOpenSelectCustomerDialog}
          className="group hover:bg-muted/50 active:bg-muted/80 flex items-center justify-between p-2.5 text-start transition-colors"
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                {t('Customer')}
              </p>
              <p className="text-foreground truncate text-xs font-semibold">{customerName}</p>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground/60 h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </button>

        <button
          type="button"
          onClick={onOpenOrderTypeDialog}
          className="group hover:bg-muted/50 active:bg-muted/80 flex items-center justify-between p-2.5 text-start transition-colors"
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
              <Truck className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                {t('Order Type')}
              </p>
              <p className="text-foreground truncate text-xs font-semibold">
                {orderType ? t(orderType.label) : t('Select Type')}
              </p>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground/60 h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </button>
      </div>

      {/* Financial Line Items */}
      <div className="divide-y divide-border/60 text-xs">
        <div className="flex items-center justify-between px-3.5 py-1.5">
          <span className="text-muted-foreground font-medium">{t('Sub Total')}</span>
          <span className="text-foreground font-semibold">{formatCurrency(subtotal)}</span>
        </div>

        {tax > 0 && (
          <div className="flex items-center justify-between px-3.5 py-1.5">
            <span className="text-muted-foreground font-medium">{t('Product Taxes')}</span>
            <span className="text-foreground font-semibold">{formatCurrency(tax)}</span>
          </div>
        )}

        <div className="flex items-center justify-between px-3.5 py-1.5">
          <button
            type="button"
            onClick={onOpenDiscountDialog}
            className="text-muted-foreground hover:text-primary active:scale-95 flex items-center gap-1 font-medium underline decoration-dotted underline-offset-2 transition-colors"
          >
            <Percent className="h-3 w-3 text-muted-foreground" />
            <span>{t('Discount')}</span>
          </button>
          <span
            onClick={onOpenDiscountDialog}
            className={cn(
              'cursor-pointer font-semibold',
              discount > 0 ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {discount > 0 ? `-${formatCurrency(discount)}` : formatCurrency(0)}
          </span>
        </div>

        {totalCoupons > 0 && (
          <div className="flex items-center justify-between px-3.5 py-1.5 text-primary">
            <div className="flex items-center gap-1 font-medium">
              <Tag className="h-3 w-3" />
              <span>{t('Coupons')}</span>
            </div>
            <span className="font-semibold">-{formatCurrency(totalCoupons)}</span>
          </div>
        )}

        {orderType?.identifier === 'delivery' && (
          <div className="flex items-center justify-between px-3.5 py-1.5">
            <button
              type="button"
              onClick={onOpenShippingDialog}
              className="text-muted-foreground hover:text-primary active:scale-95 flex items-center gap-1 font-medium underline decoration-dotted underline-offset-2 transition-colors"
            >
              <Truck className="h-3 w-3 text-primary" />
              <span>{t('Shipping')}</span>
            </button>
            <span
              onClick={onOpenShippingDialog}
              className="cursor-pointer font-semibold text-foreground"
            >
              {formatCurrency(shipping)}
            </span>
          </div>
        )}
      </div>

      {/* Grand Total Bar */}
      <div className="bg-primary/5 dark:bg-primary/10 border-t border-primary/20 flex items-center justify-between px-4 py-2.5">
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-bold tracking-tight">{t('Total Payable')}</span>
          <span className="text-muted-foreground text-[10px]">{t('Includes all applicable taxes & discounts')}</span>
        </div>
        <div className="text-primary text-xl font-extrabold tracking-tight">
          {formatCurrency(total)}
        </div>
      </div>
    </div>
  );
}
