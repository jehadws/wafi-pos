import { LABEL_PX_PER_DOT, LabelPaper } from '@/components/pos/label-paper';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import { hashKey, labelPrintableKey, PRINT_DOTS_PER_MM } from '@/lib/label-layout';
import printingService, { LabelPreviewImage } from '@/services/printing-service';
import { Tag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { buildLabelItems, getStoreName, LabelSettings, SelectedProduct } from '../page';

interface LabelPreviewProps {
  products: SelectedProduct[];
  settings: LabelSettings;
}

export function LabelPreview({ products, settings }: LabelPreviewProps) {
  const { t } = useTranslation();

  const items = useMemo(() => buildLabelItems(products, settings, getStoreName()), [products, settings]);
  const labels = items.flatMap((item) => Array.from({ length: item.copies }, () => item));

  const options = {
    widthMm: settings.widthMm,
    heightMm: settings.heightMm,
    barcodeHeightDots: Math.round(settings.barcodeHeightMm * PRINT_DOTS_PER_MM),
    showStoreName: settings.showStoreName,
    showPrice: settings.showProductPrice,
    showSku: false,
    showBarcodeText: settings.showBarcodeText,
  };

  // The server draws the printed pixels; re-request whenever a printable field or
  // the sticker geometry changes, and drop responses the user has already outpaced.
  const requestKey = useMemo(() => {
    const configKey = JSON.stringify([
      settings.widthMm,
      settings.heightMm,
      Math.round(settings.barcodeHeightMm * PRINT_DOTS_PER_MM),
      settings.showStoreName,
      settings.showProductPrice,
      settings.showBarcodeText,
    ]);
    return hashKey(configKey + items.map((item) => labelPrintableKey(item)).join(''));
  }, [items, settings]);

  const [previews, setPreviews] = useState<Record<string, LabelPreviewImage | null>>({});

  useEffect(() => {
    if (items.length === 0) {
      setPreviews({});
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      printingService
        .previewLabels(items, {
          labelWidthMm: settings.widthMm,
          labelHeightMm: settings.heightMm,
          barcodeHeight: options.barcodeHeightDots,
          showStoreNameOnLabel: settings.showStoreName,
          showPriceOnLabel: settings.showProductPrice,
          showBarcodeTextOnLabel: settings.showBarcodeText,
          // This page never prints the SKU line; pin it so the terminal's stored
          // setting cannot make the server draw something the preview asked for.
          showSkuOnLabel: false,
        })
        .then((result) => {
          if (!cancelled) setPreviews(result);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  return (
    <div className="bg-muted/40 flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="bg-background flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{t('Label preview')}</h2>
          <p className="text-muted-foreground text-xs">
            {settings.widthMm} × {settings.heightMm} mm · {labels.length} {t('labels')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {settings.itemsPerRow} {t('per row')}
          </Badge>
          <Badge variant="outline" className="font-mono">
            {t('Barcode')} {settings.barcodeHeightMm} mm
          </Badge>
        </div>
      </div>

      {labels.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-muted-foreground max-w-xs text-center">
            <div className="bg-background mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border">
              <Tag className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">{t('No products selected')}</p>
            <p className="mt-1 text-xs">{t('Search and add products to start creating labels')}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6">
          <div
            className="grid w-fit gap-3"
            style={{
              gridTemplateColumns: `repeat(${settings.itemsPerRow}, ${settings.widthMm * PRINT_DOTS_PER_MM * LABEL_PX_PER_DOT}px)`,
              padding: `${settings.verticalPadding}px ${settings.horizontalPadding}px`,
            }}
          >
            {labels.map((item, index) => (
              <LabelPaper key={`${item.barcode}-${index}`} label={item} options={options} image={previews[hashKey(labelPrintableKey(item))]} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
