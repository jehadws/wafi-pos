import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import Settings from '@/lib/settings';
import type {
  Register,
  RegisterHistory,
  ZReport as ZReportData,
  ZReportCategoryBreakdown,
  ZReportPaymentBreakdown,
  ZReportProductBreakdown,
} from '@/types/models/register';
import type { Order } from '@/types/models/order';
import { formatCurrency, formatDate } from '@/utils/format';
import { Head, usePage } from '@inertiajs/react';
import { Printer } from 'lucide-react';

interface ZReportPageProps extends ZReportData {
  title: string;
  [key: string]: unknown;
}

export default function ZReportPage() {
  const { t } = useTranslation();
  const generalSettings = Settings.get();
  const storeName = generalSettings?.identification?.sb_store_name || 'Subul POS';

  const props = usePage<ZReportPageProps>().props;
  const {
    title,
    register,
    openedOn,
    closedOn,
    openingBalance,
    closingBalance,
    difference,
    totalGrossSales,
    totalDiscounts,
    totalShippings,
    totalTaxes,
    totalSales,
    categories,
    cashier,
    sessionDuration,
    payments,
    cashOnHand,
    products,
    orders,
  } = props;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout breadcrumbs={[]}>
      <Head title={title.replace('&mdash;', '—')} />

      <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }

                    @page {
                        size: A4;
                        margin: 12mm 12mm;
                    }

                    .zreport-page {
                        padding: 0 !important;
                    }
                }
            `}</style>

      <div className="zreport-page min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <div className="no-print mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">{title.replace('&mdash;', '—')}</h1>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              {t('Print')}
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900">{storeName}</h2>
                  <p className="mt-1 text-sm text-gray-500">{t('Cash Register Z-Report')}</p>
                </div>
                <div className="text-end">
                  <div className="text-2xl font-bold text-gray-700">{t('Z-REPORT')}</div>
                  <div className="mt-1 text-sm text-gray-500">{register?.name ?? t('Register')}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-0 border-b border-gray-200">
              <div className="border-r border-gray-200 px-6 py-5">
                <h3 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('Session')}</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Register')}</span>
                    <span className="font-semibold text-gray-800">{register?.name}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Cashier')}</span>
                    <span className="text-gray-800">{cashier}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Opened')}</span>
                    <span className="text-gray-800">{openedOn}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Closed')}</span>
                    <span className="text-gray-800">{closedOn}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Duration')}</span>
                    <span className="text-gray-800">{sessionDuration}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Orders')}</span>
                    <span className="text-gray-800">{orders?.length ?? 0}</span>
                  </li>
                </ul>
              </div>

              <div className="px-6 py-5">
                <h3 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('Balances')}</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Opening Balance')}</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(openingBalance)}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Closing Balance')}</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(closingBalance)}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Expected Cash On Hand')}</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(cashOnHand)}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className={`font-medium ${difference > 0 ? 'text-red-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {t('Difference')}
                    </span>
                    <span className={`font-semibold ${difference > 0 ? 'text-red-600' : difference < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      {formatCurrency(difference)}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-5">
              <h3 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('Sales Summary')}</h3>
              <div className="flex justify-end">
                <div className="w-72 overflow-hidden rounded-lg border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                    <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">{t('Summary')}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <div className="flex justify-between px-4 py-2 text-sm">
                      <span className="text-gray-600">{t('Gross Sales')}</span>
                      <span className="font-medium text-gray-800">{formatCurrency(totalGrossSales)}</span>
                    </div>
                    {totalDiscounts > 0 && (
                      <div className="flex justify-between px-4 py-2 text-sm">
                        <span className="text-gray-600">{t('Discounts')}</span>
                        <span className="font-medium text-red-500">-{formatCurrency(totalDiscounts)}</span>
                      </div>
                    )}
                    {totalShippings > 0 && (
                      <div className="flex justify-between px-4 py-2 text-sm">
                        <span className="text-gray-600">{t('Shipping')}</span>
                        <span className="font-medium text-gray-800">{formatCurrency(totalShippings)}</span>
                      </div>
                    )}
                    {totalTaxes > 0 && (
                      <div className="flex justify-between px-4 py-2 text-sm">
                        <span className="text-gray-600">{t('Taxes')}</span>
                        <span className="font-medium text-gray-800">{formatCurrency(totalTaxes)}</span>
                      </div>
                    )}
                    <div className="flex justify-between bg-gray-800 px-4 py-3 text-white">
                      <span className="text-base font-bold">{t('NET SALES')}</span>
                      <span className="text-base font-bold">{formatCurrency(totalSales)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {payments && payments.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-5">
                <h3 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('Payment Breakdown')}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300 text-xs tracking-wider text-gray-500 uppercase">
                      <th className="py-3 text-start font-semibold">{t('Method')}</th>
                      <th className="py-3 text-end font-semibold">{t('Total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment: ZReportPaymentBreakdown, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 text-gray-800">{payment.label ?? payment.identifier}</td>
                        <td className="py-2 text-end font-medium text-gray-800">{formatCurrency(payment.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {categories && categories.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-5">
                <h3 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('Category Breakdown')}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300 text-xs tracking-wider text-gray-500 uppercase">
                      <th className="py-3 text-start font-semibold">{t('Category')}</th>
                      <th className="py-3 text-center font-semibold">{t('Items Sold')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat: ZReportCategoryBreakdown, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 text-gray-800">{cat.name}</td>
                        <td className="py-2 text-center font-medium text-gray-800">{cat.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {products && products.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-5">
                <h3 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('Product Breakdown')}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300 text-xs tracking-wider text-gray-500 uppercase">
                      <th className="py-3 text-start font-semibold">{t('Product')}</th>
                      <th className="py-3 text-center font-semibold">{t('Qty')}</th>
                      <th className="py-3 text-center font-semibold">{t('Discount')}</th>
                      <th className="py-3 text-center font-semibold">{t('Tax')}</th>
                      <th className="py-3 text-end font-semibold">{t('Total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod: ZReportProductBreakdown, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 font-medium text-gray-800">{prod.name}</td>
                        <td className="py-2 text-center text-gray-600">{prod.quantity}</td>
                        <td className="py-2 text-center text-gray-600">{formatCurrency(prod.discount ?? 0)}</td>
                        <td className="py-2 text-center text-gray-600">{formatCurrency(prod.tax_value ?? 0)}</td>
                        <td className="py-2 text-end font-semibold text-gray-800">{formatCurrency(prod.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>{t('Report generated on')}: {formatDate(new Date().toISOString())}</div>
                <div>{storeName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
