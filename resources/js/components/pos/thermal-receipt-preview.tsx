'use client';

import { ReceiptPaper } from '@/components/pos/receipt-paper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import printingService, { DEFAULT_PRINTER_SETTINGS, FormattedReceiptData, PrinterSettings } from '@/services/printing-service';
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
  const [printingReady, setPrintingReady] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);

  const handleDirectPrint = async () => {
    setIsPrinting(true);
    const res = await printingService.printReceipt(data);
    if (res.success) {
      toast.success(res.message || t('Receipt printed successfully!'));
      if (onClose) setTimeout(onClose, 1200);
    } else {
      toast.error(res.error || t('Failed to print receipt.'));
    }
    setIsPrinting(false);
  };

  useEffect(() => {
    // The terminal's settings live on the backend, so the paper redraws once they land.
    printingService
      .loadSettings()
      .then(setSettings)
      .catch(() => {});

    printingService.checkStatus().then(async (status) => {
      setPrintingReady(status.status === 'online');
      if (autoPrint && status.status === 'online') {
        await handleDirectPrint();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
        <div className="flex flex-wrap items-center gap-2">
          {printingReady === true && (
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3" />
              {t('Printing is ready')}
            </Badge>
          )}
          {printingReady === false && (
            <Badge variant="danger">
              <XCircle className="h-3 w-3" />
              {t('Printing is unavailable')}
            </Badge>
          )}
          <Badge variant="outline" className="font-mono">
            {settings.lineWidth} {t('chars per line')}
          </Badge>
          <Badge variant="outline" className="font-mono">
            {settings.copies} {settings.copies === 1 ? t('copy') : t('copies')}
          </Badge>
          <Badge variant="outline" className="font-mono uppercase">
            {settings.encoding}
          </Badge>
        </div>

        <Button onClick={handleDirectPrint} disabled={isPrinting} className="gap-2">
          {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          {t('Print to Thermal Printer')}
        </Button>
      </div>

      <div className="bg-muted/60 dark:bg-muted/20 flex overflow-auto rounded-xl border p-5" style={{ maxHeight: '58vh' }}>
        <ReceiptPaper data={data} settings={settings} className="m-auto" />
      </div>
    </div>
  );
}
