import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import Settings from '@/lib/settings';
import type { Address } from '@/types/models/address';
import type { Order } from '@/types/models/order';
import type { OrderProduct } from '@/types/models/order-product';
import type { FormFieldDef } from '@/types/forms';
import { formatCurrency, formatDate } from '@/utils/format';
import { Head, usePage } from '@inertiajs/react';
import { Printer } from 'lucide-react';

/**
 * Order as serialized by `OrdersController::orderInvoice`: the `type` column
 * is a plain string (not an OrderType object) and `paymentStatus`/`deliveryStatus`
 * are human-readable labels attached by the controller, on top of the shared
 * POS `Order` shape.
 */
type InvoiceOrder = Omit<Order, 'type' | 'payments'> & {
  type?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  billing_address?: Partial<Address>;
  shipping_address?: Partial<Address>;
};

interface OrderInvoicePageProps {
  order: InvoiceOrder;
  options: Record<string, string>;
  billing: FormFieldDef[];
  shipping: FormFieldDef[];
  title: string;
  [key: string]: unknown;
}

export default function OrderInvoicePage() {
  const { t } = useTranslation();
  const generalSettings = Settings.get();
  const storeName = generalSettings?.identification?.sb_store_name || 'Subul POS';

  const { order, title } = usePage<OrderInvoicePageProps>().props;

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
                        margin: 15mm 15mm;
                    }

                    .invoice-page {
                        padding: 0 !important;
                    }
                }
            `}</style>

      <div className="invoice-page min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          {/* Print Button */}
          <div className="no-print mb-4 flex items-center justify-between">
            {/* Controller-controlled string (`Order Invoice &mdash; {code}`); the HTML entity is decoded manually instead of dangerouslySetInnerHTML. */}
            <h1 className="text-2xl font-bold text-gray-800">{title.replace('&mdash;', '—')}</h1>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              {t('Print')}
            </Button>
          </div>

          {/* Invoice Card */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {/* Invoice Header */}
            <div className="border-b border-gray-200 bg-gray-50 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900">{storeName}</h2>
                  <p className="mt-1 text-sm text-gray-500">{t('Point of Sale System')}</p>
                </div>
                <div className="text-end">
                  <div className="text-2xl font-bold text-gray-700">{t('INVOICE')}</div>
                  <div className="mt-1 text-sm text-gray-500">#{order.code}</div>
                </div>
              </div>
            </div>

            {/* Order Details — 3 Columns */}
            <div className="grid grid-cols-3 gap-0 border-b border-gray-200">
              {/* Store Details */}
              <div className="border-r border-gray-200 px-6 py-5">
                <h3 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('Store Details')}</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Order Code')}</span>
                    <span className="font-semibold text-gray-800">{order.code}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Cashier')}</span>
                    <span className="text-gray-800">{order.user?.username}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Date')}</span>
                    <span className="text-gray-800">{formatDate(order.created_at)}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Type')}</span>
                    <span className="text-gray-800">{order.type}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{t('Payment Status')}</span>
                    <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-500'}`}>
                      {order.paymentStatus?.toUpperCase()}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Billing Details */}
              <div className="border-r border-gray-200 px-6 py-5">
                <h3 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('Billing Details')}</h3>
                <ul className="space-y-2">
                  {[
                    {
                      label: t('Name'),
                      value: `${order.billing_address?.first_name || ''} ${order.billing_address?.last_name || ''}`.trim() || t('N/A'),
                    },
                    { label: t('Phone'), value: order.billing_address?.phone || t('N/A') },
                    { label: t('Email'), value: order.billing_address?.email || t('N/A') },
                    { label: t('Address'), value: order.billing_address?.address_1 || t('N/A') },
                    { label: t('City'), value: order.billing_address?.city || t('N/A') },
                    { label: t('Country'), value: order.billing_address?.country || t('N/A') },
                    { label: t('Company'), value: order.billing_address?.company || t('N/A') },
                  ].map((item) => (
                    <li key={item.label} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-600">{item.label}</span>
                      <span className="text-gray-700">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Shipping Details */}
              <div className="px-6 py-5">
                <h3 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('Shipping Details')}</h3>
                <ul className="space-y-2">
                  {[
                    {
                      label: t('Name'),
                      value: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim() || t('N/A'),
                    },
                    { label: t('Phone'), value: order.shipping_address?.phone || t('N/A') },
                    { label: t('Email'), value: order.shipping_address?.email || t('N/A') },
                    { label: t('Address'), value: order.shipping_address?.address_1 || t('N/A') },
                    { label: t('City'), value: order.shipping_address?.city || t('N/A') },
                    { label: t('Country'), value: order.shipping_address?.country || t('N/A') },
                    { label: t('Company'), value: order.shipping_address?.company || t('N/A') },
                  ].map((item) => (
                    <li key={item.label} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-600">{item.label}</span>
                      <span className="text-gray-700">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Products Table */}
            <div className="px-6 py-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 text-xs tracking-wider text-gray-500 uppercase">
                    <th className="py-3 text-start font-semibold">{t('Product')}</th>
                    <th className="py-3 text-center font-semibold">{t('Unit Price')}</th>
                    <th className="py-3 text-center font-semibold">{t('Quantity')}</th>
                    <th className="py-3 text-center font-semibold">{t('Discount')}</th>
                    <th className="py-3 text-center font-semibold">{t('Tax')}</th>
                    <th className="py-3 text-end font-semibold">{t('Total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.products.map((product: OrderProduct, index: number) => (
                    <tr key={product.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="py-3">
                        <div className="font-semibold text-gray-800">{product.name}</div>
                        {product.unit_name && <div className="text-xs text-gray-400">{product.unit_name}</div>}
                      </td>
                      <td className="py-3 text-center text-gray-600">{formatCurrency(product.unit_price)}</td>
                      <td className="py-3 text-center text-gray-600">{product.quantity}</td>
                      <td className="py-3 text-center text-gray-600">{formatCurrency(product.discount ?? 0)}</td>
                      <td className="py-3 text-center text-gray-600">{formatCurrency(product.tax_value * product.quantity)}</td>
                      <td className="py-3 text-end font-semibold text-gray-800">{formatCurrency(product.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="flex justify-end px-6 pb-8">
              <div className="w-72 overflow-hidden rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">{t('Summary')}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-600">{t('Sub Total')}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between px-4 py-2 text-sm">
                      <span className="text-gray-600">{t('Discount')}</span>
                      <span className="font-medium text-red-500">-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  {order.tax_value > 0 && (
                    <div className="flex justify-between px-4 py-2 text-sm">
                      <span className="text-gray-600">{t('Tax')}</span>
                      <span className="font-medium text-gray-800">{formatCurrency(order.tax_value)}</span>
                    </div>
                  )}
                  <div className="flex justify-between bg-gray-800 px-4 py-3 text-white">
                    <span className="text-base font-bold">{t('Total')}</span>
                    <span className="text-base font-bold">{formatCurrency(order.total)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-600">{t('Paid')}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(order.tendered)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-600">{t('Change')}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(order.change)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
