import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import Settings from '@/lib/settings';
import type { FormFieldDef } from '@/types/forms';
import type { Order } from '@/types/models/order';
import type { OrderProductRefund, OrderRefund } from '@/types/models/order-refund';
import type { Address } from '@/types/models/address';
import { formatCurrency, formatDate } from '@/utils/format';
import { Head, usePage } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { useEffect } from 'react';

interface RefundReceiptPageProps {
  refund: Omit<OrderRefund, 'order'> & {
    order: Omit<Order, 'billing_address' | 'shipping_address'> & {
      billing_address?: Partial<Address>;
      shipping_address?: Partial<Address>;
    };
  };
  billing: FormFieldDef[];
  shipping: FormFieldDef[];
  title: string;
  options: Record<string, string>;
  [key: string]: unknown;
}

export default function RefundReceiptPage() {
  const { t } = useTranslation();
  const generalSettings = Settings.get();
  const storeName = generalSettings?.identification?.sb_store_name || 'Subul POS';
  const storeAddress = generalSettings?.identification?.sb_store_address || '';
  const storeCity = generalSettings?.identification?.sb_store_city || '';
  const storePobox = generalSettings?.identification?.sb_store_pobox || '';
  const storePhone = generalSettings?.identification?.sb_store_phone || '';
  const storeEmail = generalSettings?.identification?.sb_store_email || '';

  const { refund, title, options } = usePage<RefundReceiptPageProps>().props;

  const finalLogo = options?.sb_invoice_receipt_logo || '';
  const finalFooter = options?.sb_invoice_receipt_footer || '';
  const order = refund.order;

  const totalRefunded = (refund.refunded_products ?? []).reduce(
    (sum: number, item: OrderProductRefund) => sum + (item.total_price ?? 0),
    0,
  );

  useEffect(() => {
    // Optional: automatically open print dialog when page loads
    // setTimeout(() => window.print(), 500);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Head title={title.replace('&mdash;', '—')} />
      <div className="flex min-h-screen flex-col items-center bg-gray-100 p-6">
        <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; margin: 0; padding: 0; }

                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }

                    .receipt-wrapper {
                        box-shadow: none !important;
                        border: none !important;
                        max-width: 80mm !important;
                        margin: 0 !important;
                        padding: 4mm !important;
                    }
                }
            `}</style>

        <div className="no-print mb-4 flex w-full max-w-sm items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">{title.replace('&mdash;', '—')}</h1>
          <Button onClick={handlePrint} className="gap-2">
            <Printer size={16} />
            {t('Print Receipt')}
          </Button>
        </div>

        <div
          className="receipt-wrapper w-full rounded border border-gray-200 bg-white p-4 shadow-md"
          style={{ maxWidth: '340px', fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', color: '#000' }}
        >
          <div className="mb-3 text-center">
            {finalLogo ? (
              <img src={finalLogo} alt={storeName} style={{ maxHeight: '60px', maxWidth: '140px', margin: '0 auto 4px', display: 'block' }} />
            ) : (
              <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>{storeName}</div>
            )}
            {storeAddress && <div style={{ fontSize: '11px' }}>{storeAddress}</div>}
            {storeCity && <div style={{ fontSize: '11px' }}>{storeCity}</div>}
            {storePobox && <div style={{ fontSize: '11px' }}>{`P.O.Box: ${storePobox}`}</div>}
            {storePhone && <div style={{ fontSize: '11px' }}>{`Tel: ${storePhone}`}</div>}
            {storeEmail && <div style={{ fontSize: '11px' }}>{storeEmail}</div>}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          <div style={{ fontSize: '11px' }}>
            <div className="mb-1 flex justify-between">
              <span style={{ fontWeight: 'bold' }}>{t('Refund #')}:</span>
              <span>{refund.id}</span>
            </div>
            <div className="mb-1 flex justify-between">
              <span style={{ fontWeight: 'bold' }}>{t('Order')}:</span>
              <span>{order?.code}</span>
            </div>
            <div className="mb-1 flex justify-between">
              <span style={{ fontWeight: 'bold' }}>{t('Date')}:</span>
              <span>{formatDate(refund.created_at ?? order?.created_at)}</span>
            </div>
            {order?.customer && (
              <div className="mb-1 flex justify-between">
                <span style={{ fontWeight: 'bold' }}>{t('Customer')}:</span>
                <span>
                  {order.customer.first_name} {order.customer.last_name || ''}
                </span>
              </div>
            )}
            {order?.user && (
              <div className="mb-1 flex justify-between">
                <span style={{ fontWeight: 'bold' }}>{t('Cashier')}:</span>
                <span>{order.user.username}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                <td style={{ paddingBottom: '3px', borderBottom: '1px dashed #000', width: '55%' }}>{t('Product')}</td>
                <td style={{ paddingBottom: '3px', borderBottom: '1px dashed #000', textAlign: 'center', width: '20%' }}>{t('Qty')}</td>
                <td style={{ paddingBottom: '3px', borderBottom: '1px dashed #000', textAlign: 'right', width: '25%' }}>{t('Total')}</td>
              </tr>
            </thead>
            <tbody>
              {(refund.refunded_products ?? []).map((item: OrderProductRefund, idx: number) => (
                <tr key={`${item.id ?? idx}`} style={{ borderBottom: '1px dotted #ccc' }}>
                  <td style={{ paddingTop: '4px', paddingBottom: '4px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                      {item.product?.name || t('Refunded Item')}
                    </div>
                    {item.condition && (
                      <div style={{ fontSize: '10px', color: '#555', fontStyle: 'italic' }}>
                        {t('Condition')}: {item.condition}
                      </div>
                    )}
                  </td>
                  <td style={{ paddingTop: '4px', paddingBottom: '4px', textAlign: 'center', verticalAlign: 'top' }}>
                    {item.quantity ?? 1}
                  </td>
                  <td style={{ paddingTop: '4px', paddingBottom: '4px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top' }}>
                    {formatCurrency(item.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          {refund.shipping && refund.shipping > 0 && (
            <div style={{ fontSize: '11px' }}>
              <div className="mb-1 flex justify-between">
                <span>{t('Shipping Refund')}</span>
                <span>{formatCurrency(refund.shipping)}</span>
              </div>
            </div>
          )}

          <div style={{ borderTop: '3px double #000', margin: '6px 0' }} />

          <div className="flex justify-between" style={{ fontSize: '16px', fontWeight: 'bold' }}>
            <span>{t('TOTAL REFUNDED')}</span>
            <span>-{formatCurrency(totalRefunded + (refund.shipping ?? 0))}</span>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          <div style={{ textAlign: 'center', fontSize: '11px', lineHeight: '1.6', marginTop: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>{finalFooter || t('Thank you for your business!')}</div>
            <div style={{ fontSize: '10px', marginTop: '4px' }}>
              {t('Generated by')} {storeName}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
