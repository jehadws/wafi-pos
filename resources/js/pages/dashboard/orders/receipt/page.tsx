import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import Settings from '@/lib/settings';
import { formatCurrency, formatDate } from '@/utils/format';
import { Printer } from 'lucide-react';
import React, { useEffect } from 'react';

export default function OrderReceiptPage({ order, optionsService, title }: any) {
    const { t } = useTranslation();
    const generalSettings = Settings.get();
    const storeName = generalSettings?.identification?.ns_store_name || 'JGREM POS';
    const receiptLogo = optionsService?.ns_invoice_receipt_logo || generalSettings?.identification?.ns_store_square_logo || '';
    const receiptFooter = optionsService?.ns_invoice_receipt_footer || '';
    const showTaxBreakdown = optionsService?.ns_invoice_display_tax_breakdown === 'yes';

    useEffect(() => {
        // Optional: automatically open print dialog when page loads
        // setTimeout(() => window.print(), 500);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
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

            {/* Print button — hidden when printing */}
            <div className="w-full max-w-sm flex justify-between items-center mb-4 no-print">
                <h1 className="text-lg font-bold text-gray-800">{title}</h1>
                <Button onClick={handlePrint} className="gap-2">
                    <Printer size={16} />
                    {t('Print Receipt')}
                </Button>
            </div>

            {/* Receipt */}
            <div
                className="receipt-wrapper bg-white shadow-md border border-gray-200 rounded p-4 w-full"
                style={{ maxWidth: '340px', fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', color: '#000' }}
            >
                {/* Store Header */}
                <div className="text-center mb-3">
                    {receiptLogo ? (
                        <img src={receiptLogo} alt={storeName} style={{ maxHeight: '60px', maxWidth: '140px', margin: '0 auto 4px', display: 'block' }} />
                    ) : (
                        <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>{storeName}</div>
                    )}
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* Order Info */}
                <div style={{ fontSize: '11px' }}>
                    <div className="flex justify-between mb-1">
                        <span style={{ fontWeight: 'bold' }}>{t('Order')}:</span>
                        <span>{order.code}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span style={{ fontWeight: 'bold' }}>{t('Date')}:</span>
                        <span>{formatDate(order.created_at)}</span>
                    </div>
                    {order.customer && (
                        <div className="flex justify-between mb-1">
                            <span style={{ fontWeight: 'bold' }}>{t('Customer')}:</span>
                            <span>{order.customer.first_name} {order.customer.last_name || ''}</span>
                        </div>
                    )}
                    {order.user && (
                        <div className="flex justify-between mb-1">
                            <span style={{ fontWeight: 'bold' }}>{t('Cashier')}:</span>
                            <span>{order.user.username}</span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* Products Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                        <tr style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                            <td style={{ paddingBottom: '3px', borderBottom: '1px dashed #000', width: '55%' }}>{t('Product')}</td>
                            <td style={{ paddingBottom: '3px', borderBottom: '1px dashed #000', textAlign: 'center', width: '20%' }}>{t('Qty')}</td>
                            <td style={{ paddingBottom: '3px', borderBottom: '1px dashed #000', textAlign: 'right', width: '25%' }}>{t('Total')}</td>
                        </tr>
                    </thead>
                    <tbody>
                        {order.products?.map((item: any) => (
                            <tr key={item.id} style={{ borderBottom: '1px dotted #ccc' }}>
                                <td style={{ paddingTop: '4px', paddingBottom: '4px', verticalAlign: 'top' }}>
                                    <div style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{item.name}</div>
                                    <div style={{ fontSize: '10px', color: '#333' }}>{formatCurrency(item.unit_price)}</div>
                                </td>
                                <td style={{ paddingTop: '4px', paddingBottom: '4px', textAlign: 'center', verticalAlign: 'top' }}>{item.quantity}</td>
                                <td style={{ paddingTop: '4px', paddingBottom: '4px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top' }}>{formatCurrency(item.total_price)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Divider */}
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* Summary */}
                <div style={{ fontSize: '11px' }}>
                    <div className="flex justify-between mb-1">
                        <span>{t('Subtotal')}</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                        <div className="flex justify-between mb-1" style={{ color: '#555' }}>
                            <span>{t('Discount')}</span>
                            <span>-{formatCurrency(order.discount)}</span>
                        </div>
                    )}
                    {order.tax_value > 0 && (
                        <div className="flex justify-between mb-1">
                            <span>{t('Tax')}</span>
                            <span>{formatCurrency(order.tax_value)}</span>
                        </div>
                    )}
                </div>

                {/* Double divider before total */}
                <div style={{ borderTop: '3px double #000', margin: '6px 0' }} />

                {/* Total */}
                <div className="flex justify-between" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    <span>{t('TOTAL')}</span>
                    <span>{formatCurrency(order.total)}</span>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* Payments */}
                {order.payments && order.payments.length > 0 && (
                    <div style={{ fontSize: '11px' }}>
                        <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>{t('Payment')}</div>
                        {order.payments.map((payment: any) => (
                            <div key={payment.id} className="flex justify-between mb-1">
                                <span>{payment.label || t('Payment')}</span>
                                <span>{formatCurrency(payment.value)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between mb-1">
                            <span style={{ fontWeight: 'bold' }}>{t('Tendered')}</span>
                            <span>{formatCurrency(order.tendered)}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>{t('Change')}</span>
                            <span>{formatCurrency(order.change)}</span>
                        </div>
                    </div>
                )}

                {/* Divider */}
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* Footer */}
                <div style={{ textAlign: 'center', fontSize: '11px', lineHeight: '1.6', marginTop: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>
                        {receiptFooter || t('Thank you for your business!')}
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '4px' }}>
                        {t('Generated by')} {storeName}
                    </div>
                </div>
            </div>
        </div>
    );
}
