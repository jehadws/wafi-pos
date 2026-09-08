'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import Settings from '@/lib/settings';
import PrintAgentService, { FormattedReceiptData } from '@/services/print-agent-service';
import { formatCurrency } from '@/utils/format';
import { Eye, Loader2, Printer, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PrinterSettingsDialog } from './printer-settings-dialog';
import { ThermalReceiptPreview } from './thermal-receipt-preview';

export interface InvoiceItem {
    id: number;
    name: string;
    quantity: number;
    price: number;
    total: number;
    unit_name?: string;
}

export interface Invoice {
    id: string;
    date: string;
    orderReceipt: string;
    items: InvoiceItem[];
    subtotal: number;
    discount: number;
    total: number;
    cash: number;
    paid: number;
    change: number;
    taxValue?: number;
    taxes?: { name: string; rate: number; tax_value: number }[];
}

interface SimplePrintInvoiceProps {
    invoice: Invoice;
}

export function SimplePrintInvoice({ invoice }: SimplePrintInvoiceProps) {
    const { t } = useTranslation();
    const { options } = usePOS();
    const generalSettings = Settings.get();
    const [isPrinting, setIsPrinting] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const storeName = generalSettings?.identification?.sb_store_name || 'Subul POS';
    const storeAddress = generalSettings?.identification?.sb_store_address || '';
    const storePhone = generalSettings?.identification?.sb_store_phone || '';
    const storeLogo =
        generalSettings?.identification?.sb_store_square_logo ||
        (options?.sb_invoice_receipt_logo as string | undefined) ||
        '';
    const receiptFooter = options?.sb_invoice_receipt_footer || '';

    // Build standard receipt data payload
    const receiptData: FormattedReceiptData = {
        storeName,
        storeAddress,
        storePhone,
        storeLogo: storeLogo || undefined,
        orderCode: invoice.orderReceipt,
        date: invoice.date ? new Date(invoice.date).toLocaleString() : new Date().toLocaleString(),
        items: invoice.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: formatCurrency(item.price),
            total: formatCurrency(item.total),
        })),
        subtotal: formatCurrency(invoice.subtotal),
        discount: invoice.discount > 0 ? formatCurrency(invoice.discount) : undefined,
        tax: invoice.taxValue ? formatCurrency(invoice.taxValue) : undefined,
        taxes: invoice.taxes?.map((tx) => ({
            name: tx.name,
            rate: tx.rate,
            tax_value: tx.tax_value,
        })),
        total: formatCurrency(invoice.total),
        tendered: formatCurrency(invoice.paid || invoice.cash),
        change: formatCurrency(invoice.change),
        barcode: invoice.orderReceipt,
        footer: receiptFooter || t('Thank you for your business!'),
    };

    // Direct ESC/POS Print via Local Windows Print Agent
    const handleDirectPrint = async () => {
        setIsPrinting(true);
        try {
            const res = await PrintAgentService.printReceipt(receiptData);
            toast.success(res.message || t('Receipt printed directly on thermal printer.'));
        } catch (err: any) {
            toast.error(err.message || t('Print Agent error. Please check printer connection.'));
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Direct Print Button */}
            <Button
                onClick={handleDirectPrint}
                disabled={isPrinting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
            >
                {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                {t('Print Thermal Receipt')}
            </Button>

            {/* Preview Button */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" title={t('Receipt Preview')}>
                        <Eye className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('Thermal Receipt Preview')}</DialogTitle>
                    </DialogHeader>
                    <ThermalReceiptPreview data={receiptData} onClose={() => setIsPreviewOpen(false)} />
                </DialogContent>
            </Dialog>

            {/* Printer Settings Trigger */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                title={t('Printer Configuration')}
            >
                <Settings2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>

            <PrinterSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </div>
    );
}
