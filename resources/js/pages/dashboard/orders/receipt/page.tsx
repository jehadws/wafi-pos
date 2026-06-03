import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import Settings from '@/lib/settings';
import { formatCurrency, formatDate } from '@/utils/format';
import { Printer } from 'lucide-react';
import React, { useEffect } from 'react';

export default function OrderReceiptPage({ order, optionsService, title }: any) {
  const { t } = useTranslation();
  const generalSettings = Settings.get();
  const storeName = generalSettings?.ns_store_name || 'JgremPOS';
  const receiptLogo = optionsService?.ns_invoice_receipt_logo || '';
  const receiptFooter = optionsService?.ns_invoice_receipt_footer || '';

  useEffect(() => {
    // Optional: automatically open print dialog when page loads
    // setTimeout(() => window.print(), 500);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      {/* Hide the print button when actually printing */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; padding: 0; }
          .receipt-container { box-shadow: none !important; max-width: 100% !important; border: none !important; }
        }
      `}</style>

      <div className="w-full max-w-md flex justify-between items-center mb-4 no-print">
        <h1 className="text-xl font-bold">{title}</h1>
        <Button onClick={handlePrint} className="gap-2">
          <Printer size={16} />
          {t('Print Receipt')}
        </Button>
      </div>

      <div className="receipt-container bg-white shadow-lg border rounded-lg p-6 w-full max-w-md text-sm font-mono text-gray-800">
        <div className="text-center mb-6">
          {receiptLogo && (
            <img src={receiptLogo} alt={storeName} className="max-h-16 mx-auto mb-2" />
          )}
          <h2 className="text-xl font-bold">{storeName}</h2>
          <p className="text-gray-500">{t('Point of Sale System')}</p>
        </div>

        <div className="mb-4 pb-4 border-b border-dashed border-gray-300">
          <div className="flex justify-between mb-1">
            <span className="font-semibold">{t('Order')}:</span>
            <span>{order.code}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-semibold">{t('Date')}:</span>
            <span>{formatDate(order.created_at)}</span>
          </div>
          {order.customer && (
            <div className="flex justify-between mb-1">
              <span className="font-semibold">{t('Customer')}:</span>
              <span>{order.customer.first_name} {order.customer.last_name || ''}</span>
            </div>
          )}
          {order.user && (
            <div className="flex justify-between">
              <span className="font-semibold">{t('Cashier')}:</span>
              <span>{order.user.username}</span>
            </div>
          )}
        </div>

        <table className="w-full mb-4">
          <thead>
            <tr className="border-b border-gray-300 text-left">
              <th className="py-2">{t('Item')}</th>
              <th className="py-2 text-center">{t('Qty')}</th>
              <th className="py-2 text-right">{t('Total')}</th>
            </tr>
          </thead>
          <tbody>
            {order.products?.map((item: any) => (
              <tr key={item.id} className="border-b border-dashed border-gray-200">
                <td className="py-2 pr-2">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-gray-500">{formatCurrency(item.unit_price)}</div>
                </td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right font-semibold">{formatCurrency(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 mb-6 pb-4 border-b border-dashed border-gray-300">
          <div className="flex justify-between">
            <span>{t('Subtotal')}</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>{t('Discount')}</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          {order.tax_value > 0 && (
            <div className="flex justify-between">
              <span>{t('Tax')}</span>
              <span>{formatCurrency(order.tax_value)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-800">
            <span>{t('Total')}</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        {order.payments && order.payments.length > 0 && (
          <div className="mb-6 pb-4 border-b border-dashed border-gray-300">
            <h4 className="font-bold mb-2">{t('Payments')}</h4>
            {order.payments.map((payment: any) => (
              <div key={payment.id} className="flex justify-between text-sm mb-1">
                <span>{payment.label || t('Payment')}</span>
                <span>{formatCurrency(payment.value)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold mt-2">
              <span>{t('Tendered')}</span>
              <span>{formatCurrency(order.tendered)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('Change')}</span>
              <span>{formatCurrency(order.change)}</span>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          <p>{receiptFooter || t('Thank you for your business!')}</p>
          <p className="mt-2 text-xs">{t('Generated by')} {storeName}</p>
        </div>
      </div>
    </div>
  );
}
