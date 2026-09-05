'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import PrintAgentService, { FormattedReceiptData } from '@/services/print-agent-service';
import { CheckCircle2, Loader2, Printer, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ThermalReceiptPreviewProps {
    data: FormattedReceiptData;
    onClose?: () => void;
    autoPrint?: boolean;
}

export function ThermalReceiptPreview({ data, onClose, autoPrint = false }: ThermalReceiptPreviewProps) {
    const { t } = useTranslation();
    const [isPrinting, setIsPrinting] = useState(false);
    const [agentOnline, setAgentOnline] = useState<boolean | null>(null);
    const settings = PrintAgentService.getSettings();

    useEffect(() => {
        PrintAgentService.checkStatus().then((status) => {
            setAgentOnline(status.status === 'online');
            if (autoPrint && status.status === 'online') {
                handleDirectPrint();
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDirectPrint = async () => {
        setIsPrinting(true);
        try {
            const res = await PrintAgentService.printReceipt(data);
            toast.success(res.message || t('Receipt printed successfully!'));
            if (onClose) setTimeout(onClose, 1200);
        } catch (err: any) {
            toast.error(err.message || t('Failed to print receipt.'));
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            {/* Header controls & Agent Status */}
            <div className="flex w-full max-w-sm items-center justify-between">
                <div className="flex items-center gap-2">
                    {agentOnline === true && (
                        <Badge variant="outline" className="border-green-500 bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300">
                            <CheckCircle2 className="me-1 h-3 w-3 text-green-500" />
                            {t('Print Agent Online')}
                        </Badge>
                    )}
                    {agentOnline === false && (
                        <Badge variant="destructive">
                            <XCircle className="me-1 h-3 w-3" />
                            {t('Print Agent Offline')}
                        </Badge>
                    )}
                </div>

                <Button onClick={handleDirectPrint} disabled={isPrinting} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                    {t('Print to Thermal Printer')}
                </Button>
            </div>

            {/* Simulated 76mm/80mm Thermal Receipt Preview */}
            <div
                className="w-full rounded-md border border-neutral-300 bg-white p-5 text-neutral-900 shadow-xl dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                style={{
                    maxWidth: '360px',
                    fontFamily: '"Courier New", Courier, monospace',
                    fontSize: '12px',
                    lineHeight: '1.4',
                }}
            >
                {/* Store Header */}
                <div className="text-center font-bold">
                    {data.storeLogo && (
                        <img
                            src={data.storeLogo}
                            alt={data.storeName || 'Store logo'}
                            className="mx-auto mb-1 object-contain"
                            style={{ maxHeight: '60px', maxWidth: '140px' }}
                        />
                    )}
                    <div className="text-lg uppercase tracking-wider">{data.storeName || 'Subul POS'}</div>
                    {data.storeAddress && <div className="text-xs font-normal text-neutral-600 dark:text-neutral-400">{data.storeAddress}</div>}
                    {data.storePhone && <div className="text-xs font-normal text-neutral-600 dark:text-neutral-400">Tel: {data.storePhone}</div>}
                </div>

                {/* Divider */}
                <div className="my-2 border-t border-dashed border-neutral-400 dark:border-neutral-600" />

                {/* Order Meta */}
                <div className="space-y-0.5 text-xs">
                    {data.orderCode && (
                        <div className="flex justify-between">
                            <span className="font-semibold">{t('Order')}:</span>
                            <span>{data.orderCode}</span>
                        </div>
                    )}
                    {data.date && (
                        <div className="flex justify-between">
                            <span className="font-semibold">{t('Date')}:</span>
                            <span>{data.date}</span>
                        </div>
                    )}
                    {data.cashier && (
                        <div className="flex justify-between">
                            <span className="font-semibold">{t('Cashier')}:</span>
                            <span>{data.cashier}</span>
                        </div>
                    )}
                    {data.customer && (
                        <div className="flex justify-between">
                            <span className="font-semibold">{t('Customer')}:</span>
                            <span>{data.customer}</span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="my-2 border-t border-dashed border-neutral-400 dark:border-neutral-600" />

                {/* Products Table Header */}
                <div className="flex justify-between text-xs font-bold uppercase pb-1 border-b border-neutral-300 dark:border-neutral-700">
                    <span className="w-7/12">{t('Item')}</span>
                    <span className="w-2/12 text-center">{t('Qty')}</span>
                    <span className="w-3/12 text-end">{t('Total')}</span>
                </div>

                {/* Products List */}
                <div className="divide-y divide-dotted divide-neutral-200 dark:divide-neutral-800 text-xs">
                    {data.items?.map((item, idx) => (
                        <div key={idx} className="py-1.5">
                            <div className="flex justify-between items-start">
                                <span className="w-7/12 font-medium break-words pe-1">{item.name}</span>
                                <span className="w-2/12 text-center">{item.quantity}x</span>
                                <span className="w-3/12 text-end font-bold">{item.total}</span>
                            </div>
                            {item.price && (
                                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 ps-1">
                                    @ {item.price}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="my-2 border-t border-dashed border-neutral-400 dark:border-neutral-600" />

                {/* Summary */}
                <div className="space-y-1 text-xs">
                    {data.subtotal !== undefined && (
                        <div className="flex justify-between">
                            <span>{t('Subtotal')}</span>
                            <span>{data.subtotal}</span>
                        </div>
                    )}
                    {data.discount !== undefined && Number(data.discount) > 0 && (
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                            <span>{t('Discount')}</span>
                            <span>-{data.discount}</span>
                        </div>
                    )}
                    {settings.showTaxBreakdown && data.taxes && data.taxes.length > 0 ? (
                        data.taxes.map((tx, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400 ps-2">
                                <span>{tx.name} ({tx.rate}%)</span>
                                <span>{tx.tax_value}</span>
                            </div>
                        ))
                    ) : (
                        data.tax !== undefined && Number(data.tax) > 0 && (
                            <div className="flex justify-between">
                                <span>{t('Tax')}</span>
                                <span>{data.tax}</span>
                            </div>
                        )
                    )}
                </div>

                {/* Double Border Total */}
                <div className="my-2 border-t-2 border-b-2 border-neutral-900 py-1.5 dark:border-neutral-100">
                    <div className="flex justify-between text-base font-black">
                        <span>{t('TOTAL')}</span>
                        <span>{data.total}</span>
                    </div>
                </div>

                {/* Payments */}
                <div className="space-y-1 text-xs">
                    {data.tendered !== undefined && (
                        <div className="flex justify-between">
                            <span className="font-semibold">{t('Tendered')}</span>
                            <span>{data.tendered}</span>
                        </div>
                    )}
                    {data.change !== undefined && (
                        <div className="flex justify-between">
                            <span className="font-semibold">{t('Change')}</span>
                            <span>{data.change}</span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="my-2 border-t border-dashed border-neutral-400 dark:border-neutral-600" />

                {/* Footer */}
                <div className="text-center text-xs space-y-0.5 pt-1">
                    <div className="font-semibold">{data.footer || t('Thank you for your business!')}</div>
                    <div className="text-[10px] text-neutral-500">Powered by Subul POS</div>
                </div>
            </div>
        </div>
    );
}
