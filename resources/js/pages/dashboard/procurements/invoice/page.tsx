import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import Settings from '@/lib/settings';
import type { Procurement, ProcurementProduct } from '@/types/models/procurement';
import { formatCurrency, formatDate } from '@/utils/format';
import { Head, usePage } from '@inertiajs/react';
import { Printer } from 'lucide-react';

interface ProcurementInvoicePageProps {
  title: string;
  description: string;
  procurement: Procurement;
  options: Record<string, unknown>;
  [key: string]: unknown;
}

export default function ProcurementInvoicePage() {
  const { t } = useTranslation();
  const generalSettings = Settings.get();
  const storeName = generalSettings?.identification?.sb_store_name || 'Subul POS';
  const storeAddress = generalSettings?.identification?.sb_store_address || '';
  const storeCity = generalSettings?.identification?.sb_store_city || '';
  const storePhone = generalSettings?.identification?.sb_store_phone || '';
  const storeEmail = generalSettings?.identification?.sb_store_email || '';

  const { title, description, procurement } = usePage<ProcurementInvoicePageProps>().props;

  const subtotal = (procurement.products ?? []).reduce(
    (sum: number, item: ProcurementProduct) => sum + (item.total_purchase_price ?? item.purchase_price ?? 0),
    0,
  );

  const handlePrint = () => {
    window.print();
  };

  const itemCount = (procurement.products ?? []).reduce(
    (sum: number, item: ProcurementProduct) => sum + (item.quantity ?? 0),
    0,
  );

  return (
    <AppLayout breadcrumbs={[]}>
      <Head title={title} />

      <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }

                    @page {
                        size: A4;
                        margin: 15mm 15mm;
                    }

                    .procurement-page {
                        padding: 0 !important;
                    }
                }
            `}</style>

      <div className="procurement-page min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <div className="no-print mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
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
                  <p className="mt-1 text-sm text-gray-500">{description}</p>
                </div>
                <div className="text-end">
                  <div className="text-2xl font-bold text-gray-700">{t('INVOICE')}</div>
                  <div className="mt-1 text-sm text-gray-500">#{procurement.name}</div>
                  {procurement.invoice_reference && (
                    <div className="mt-1 text-sm text-gray-500">
                      {t('Ref')}: {procurement.invoice_reference}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-0 border-b border-gray-200">
              <div className="border-r border-gray-200 px-6 py-5">
                <h3 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('Store Details')}</h3>
                <ul className="space-y-2 text-sm">
                  <li className="font-semibold text-gray-800">{storeName}</li>
                  {storeAddress && <li className="text-gray-600">{storeAddress}</li>}
                  {storeCity && <li className="text-gray-600">{storeCity}</li>}
                  {storePhone && <li className="text-gray-600">{t('Tel')}: {storePhone}</li>}
                  {storeEmail && <li className="text-gray-600">{storeEmail}</li>}
                </ul>
              </div>

              <div className="border-r border-gray-200 px-6 py-5">
                <h3 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('Supplier')}</h3>
                <ul className="space-y-2 text-sm">
                  {procurement.provider ? (
                    <>
                      <li className="font-semibold text-gray-800">{procurement.provider.name}</li>
                      {procurement.provider.phone && (
                        <li className="text-gray-600">{t('Tel')}: {procurement.provider.phone}</li>
                      )}
                      {procurement.provider.email && (
                        <li className="text-gray-600">{procurement.provider.email}</li>
                      )}
                    </>
                  ) : (
                    <li className="text-gray-500">{t('N/A')}</li>
                  )}
                </ul>
              </div>

              <div className="px-6 py-5">
                <h3 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('Procurement')}</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Date')}</span>
                    <span className="text-gray-800">{formatDate(procurement.created_at)}</span>
                  </li>
                  {procurement.invoice_date && (
                    <li className="flex justify-between text-sm">
                      <span className="font-medium text-gray-600">{t('Invoice Date')}</span>
                      <span className="text-gray-800">{formatDate(procurement.invoice_date)}</span>
                    </li>
                  )}
                  {procurement.delivery_time && (
                    <li className="flex justify-between text-sm">
                      <span className="font-medium text-gray-600">{t('Delivery')}</span>
                      <span className="text-gray-800">{formatDate(procurement.delivery_time)}</span>
                    </li>
                  )}
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Status')}</span>
                    <span className="text-gray-800 capitalize">{procurement.delivery_status}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Payment')}</span>
                    <span className={`font-semibold capitalize ${procurement.payment_status === 'paid' ? 'text-green-600' : 'text-red-500'}`}>
                      {procurement.payment_status}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 text-xs tracking-wider text-gray-500 uppercase">
                    <th className="py-3 text-start font-semibold">#</th>
                    <th className="py-3 text-start font-semibold">{t('Product')}</th>
                    <th className="py-3 text-start font-semibold">{t('Barcode')}</th>
                    <th className="py-3 text-center font-semibold">{t('Unit')}</th>
                    <th className="py-3 text-center font-semibold">{t('Qty')}</th>
                    <th className="py-3 text-center font-semibold">{t('Unit Cost')}</th>
                    <th className="py-3 text-center font-semibold">{t('Tax')}</th>
                    <th className="py-3 text-end font-semibold">{t('Total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(procurement.products ?? []).map((item: ProcurementProduct, index: number) => (
                    <tr key={item.id ?? index} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="py-3 text-gray-500">{index + 1}</td>
                      <td className="py-3">
                        <div className="font-semibold text-gray-800">{item.name ?? item.product?.name ?? t('Unknown')}</div>
                        {item.product?.sku && <div className="text-xs text-gray-400">SKU: {item.product.sku}</div>}
                      </td>
                      <td className="py-3 text-gray-600">{item.barcode ?? item.product?.barcode ?? '-'}</td>
                      <td className="py-3 text-center text-gray-600">{item.unit?.name ?? '-'}</td>
                      <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 text-center text-gray-600">{formatCurrency(item.purchase_price ?? 0)}</td>
                      <td className="py-3 text-center text-gray-600">{formatCurrency(item.tax_value ?? 0)}</td>
                      <td className="py-3 text-end font-semibold text-gray-800">
                        {formatCurrency(item.total_purchase_price ?? (item.purchase_price ?? 0) * (item.quantity ?? 0))}
                      </td>
                    </tr>
                  ))}
                  {(procurement.products ?? []).length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        {t('No products found.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between border-t border-gray-200 px-6 pb-8 pt-5">
              <div className="text-sm text-gray-500">
                <div className="font-medium text-gray-700">{t('Items')}: {itemCount}</div>
                <div className="font-medium text-gray-700">{t('Lines')}: {(procurement.products ?? []).length}</div>
                {procurement.description && (
                  <div className="mt-4 max-w-sm">
                    <div className="font-medium text-gray-700">{t('Notes')}:</div>
                    <div className="text-gray-600">{procurement.description}</div>
                  </div>
                )}
              </div>

              <div className="w-72 overflow-hidden rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">{t('Summary')}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-600">{t('Subtotal')}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(subtotal)}</span>
                  </div>
                  {procurement.tax_value && procurement.tax_value > 0 && (
                    <div className="flex justify-between px-4 py-2 text-sm">
                      <span className="text-gray-600">{t('Tax')}</span>
                      <span className="font-medium text-gray-800">{formatCurrency(procurement.tax_value)}</span>
                    </div>
                  )}
                  {procurement.cost && procurement.cost > 0 && (
                    <div className="flex justify-between px-4 py-2 text-sm">
                      <span className="text-gray-600">{t('Shipping / Other')}</span>
                      <span className="font-medium text-gray-800">{formatCurrency(procurement.cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between bg-gray-800 px-4 py-3 text-white">
                    <span className="text-base font-bold">{t('GRAND TOTAL')}</span>
                    <span className="text-base font-bold">{formatCurrency(procurement.value ?? subtotal + (procurement.tax_value ?? 0) + (procurement.cost ?? 0))}</span>
                  </div>
                </div>
              </div>
            </div>

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
