import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';

type Summary = {
  sales_discounts: number;
  product_taxes: number;
  sales_taxes: number;
  subtotal: number;
  shipping: number;
  profit: number;
  total_purchase_price: number;
  total: number;
};

export default function SalesSummary({ summary }: { summary: Summary }) {
  const { t } = useTranslation();
  return (
    <div className="mb-8">
      <h3 className="mb-4 text-lg font-semibold">{t('Financial Summary')}</h3>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Sub Total Card */}
        <div className="bg-primary/10 border-primary/20 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary text-sm font-medium">{t('Sub Total')}</p>
              <p className="text-foreground text-2xl font-bold tabular-nums">{formatCurrency(summary.subtotal)}</p>
            </div>
            <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-full">
              <svg className="text-primary-foreground h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Card */}
        <div className="bg-primary/10 border-primary/20 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary text-sm font-medium">{t('Total')}</p>
              <p className="text-foreground text-2xl font-bold tabular-nums">{formatCurrency(summary.total)}</p>
            </div>
            <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-full">
              <svg className="text-primary-foreground h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Cost of Goods Card */}
        <div className="bg-muted/60 border-border rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">{t('Cost of Goods')}</p>
              <p className="text-foreground text-2xl font-bold tabular-nums">{formatCurrency(summary.total_purchase_price)}</p>
            </div>
            <div className="bg-muted-foreground/15 text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-primary/10 border-primary/20 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary text-sm font-medium">{t('Profit')}</p>
              <p className="text-foreground text-2xl font-bold tabular-nums">{formatCurrency(summary.profit)}</p>
            </div>
            <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-full">
              <svg className="text-primary-foreground h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
        <h4 className="text-md text-foreground mb-4 font-semibold">{t('Detailed Breakdown')}</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b py-2">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/70 h-2 w-2 rounded-full"></div>
              <span className="text-foreground text-sm font-medium">{t('Sales Discounts')}</span>
            </div>
            <span className="text-destructive text-sm font-semibold tabular-nums">-{formatCurrency(summary.sales_discounts)}</span>
          </div>

          <div className="flex items-center justify-between border-b py-2">
            <div className="flex items-center gap-3">
              <div className="bg-muted-foreground/60 h-2 w-2 rounded-full"></div>
              <span className="text-foreground text-sm font-medium">{t('Sales Taxes')}</span>
            </div>
            <span className="text-muted-foreground text-sm font-semibold tabular-nums">{formatCurrency(summary.sales_taxes)}</span>
          </div>

          <div className="flex items-center justify-between border-b py-2">
            <div className="flex items-center gap-3">
              <div className="bg-muted-foreground/60 h-2 w-2 rounded-full"></div>
              <span className="text-foreground text-sm font-medium">{t('Product Taxes')}</span>
            </div>
            <span className="text-muted-foreground text-sm font-semibold tabular-nums">{formatCurrency(summary.product_taxes)}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="bg-primary/70 h-2 w-2 rounded-full"></div>
              <span className="text-foreground text-sm font-medium">{t('Shipping')}</span>
            </div>
            <span className="text-primary text-sm font-semibold tabular-nums">{formatCurrency(summary.shipping)}</span>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">{t('Profit Margin')}</span>
            <span className="text-primary text-sm font-semibold tabular-nums">{((summary.profit / summary.total) * 100).toFixed(1)}%</span>
          </div>
          <div className="bg-muted mt-2 h-2 w-full rounded-full">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((summary.profit / summary.total) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
