'use client';

import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { PRINT_DOTS_PER_MM } from '@/lib/label-layout';
import Settings from '@/lib/settings';
import printingService, { PrinterSettings } from '@/services/printing-service';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LabelPreview } from './components/label-preview';
import { LabelSettingsPanel } from './components/label-settings';
import { ProductSearch } from './components/product-search';

export interface LabelSettings {
  itemsPerRow: number;
  verticalPadding: number;
  horizontalPadding: number;
  widthMm: number;
  heightMm: number;
  barcodeHeightMm: number;
  showStoreName: boolean;
  showBarcodeText: boolean;
  showProductPrice: boolean;
  showProductUnit: boolean;
  showProductName: boolean;
}

export interface SelectedProduct extends ProductSearchResult {
  times: number;
  selectedUnitQuantity: UnitQuantity;
}

export const getStoreName = () => Settings.get()?.identification?.sb_store_name || 'Subul POS';

/** The three printable fields the label page shares with the terminal settings. */
const labelSettingsFrom = (saved: PrinterSettings) => ({
  widthMm: saved.labelWidthMm,
  heightMm: saved.labelHeightMm,
  barcodeHeightMm: Math.round(saved.barcodeHeight / PRINT_DOTS_PER_MM),
});

/**
 * Single source of the printed payload: the preview renders exactly these items.
 */
export function buildLabelItems(products: SelectedProduct[], settings: LabelSettings, storeName: string) {
  return products.map((product) => ({
    name: settings.showProductName ? product.name : '',
    price: settings.showProductPrice ? String(product.selectedUnitQuantity.sale_price) : undefined,
    barcode: product.selectedUnitQuantity.barcode,
    sku: product.sku,
    unit: settings.showProductUnit ? product.selectedUnitQuantity.unit.name : '',
    copies: product.times,
    storeName: settings.showStoreName ? storeName : undefined,
  }));
}

export default function LabelPrinter() {
  const { t } = useTranslation();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  const [settings, setSettings] = useState<LabelSettings>(() => ({
    itemsPerRow: 1,
    verticalPadding: 16,
    horizontalPadding: 16,
    showStoreName: true,
    showBarcodeText: true,
    showProductPrice: true,
    showProductUnit: true,
    showProductName: true,
    ...labelSettingsFrom(printingService.getSettings()),
  }));

  // The label size lives on the terminal's stored settings, not in this browser.
  useEffect(() => {
    printingService
      .loadSettings()
      .then((saved) => setSettings((current) => ({ ...current, ...labelSettingsFrom(saved) })))
      .catch(() => toast.error(t('Could not load the saved label settings.')));
  }, [t]);

  const handleSettingsChange = (next: LabelSettings) => {
    const sizeChanged = next.widthMm !== settings.widthMm || next.heightMm !== settings.heightMm;
    const barcodeChanged = next.barcodeHeightMm !== settings.barcodeHeightMm;
    setSettings(next);
    if (sizeChanged || barcodeChanged) {
      printingService
        .saveSettings({
          ...(sizeChanged ? { labelWidthMm: next.widthMm, labelHeightMm: next.heightMm } : {}),
          ...(barcodeChanged ? { barcodeHeight: Math.round(next.barcodeHeightMm * PRINT_DOTS_PER_MM) } : {}),
        })
        .catch((err: any) => toast.error(err?.message || t('Failed to save label settings.')));
    }
  };

  const handlePrint = async () => {
    if (selectedProducts.length === 0) {
      toast.error(t('No products selected for printing'));
      return;
    }

    const labelItems = buildLabelItems(selectedProducts, settings, getStoreName());

    const res = await printingService.printLabels(labelItems, {
      labelWidthMm: settings.widthMm,
      labelHeightMm: settings.heightMm,
      barcodeHeight: Math.round(settings.barcodeHeightMm * PRINT_DOTS_PER_MM),
      showStoreNameOnLabel: settings.showStoreName,
      showPriceOnLabel: settings.showProductPrice,
      showBarcodeTextOnLabel: settings.showBarcodeText,
    });

    if (res.success) {
      toast.success(res.message || t('Labels sent to thermal printer successfully!'));
    } else {
      toast.error(res.error || t('Failed to print labels.'));
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-1">
        {/* Product Search Sidebar */}
        <ProductSearch selectedProducts={selectedProducts} onProductsChange={setSelectedProducts} onPrint={handlePrint} />

        {/* Label Preview */}
        <LabelPreview products={selectedProducts} settings={settings} />

        {/* Settings Sidebar */}
        <LabelSettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
      </div>
    </AppLayout>
  );
}
