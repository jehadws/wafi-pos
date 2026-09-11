'use client';

import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import PrintAgentService from '@/services/print-agent-service';
import { formatCurrency } from '@/utils/format';
import { useState } from 'react';
import { toast } from 'sonner';
import { LabelPreview } from './components/label-preview';
import { LabelSettingsPanel } from './components/label-settings';
import { ProductSearch } from './components/product-search';

export interface LabelSettings {
  itemsPerRow: number;
  verticalPadding: number;
  horizontalPadding: number;
  barcodeHeight: number;
  documentSize: number;
  showStoreName: boolean;
  showBarcodeText: boolean;
  showProductPrice: boolean;
  showProductName: boolean;
}

export interface LabelPrintingState {
  selectedProducts: ProductSearchResult[];
  settings: LabelSettings;
  searchQuery: string;
}

interface SelectedProduct extends ProductSearchResult {
  times: number;
  selectedUnitQuantity: UnitQuantity | null;
}

export default function LabelPrinter() {
  const { t } = useTranslation();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  const [settings, setSettings] = useState<LabelSettings>({
    itemsPerRow: 1,
    verticalPadding: 16,
    horizontalPadding: 16,
    barcodeHeight: 30,
    documentSize: 800,
    showStoreName: true,
    showBarcodeText: true,
    showProductPrice: true,
    showProductName: true,
  });

  const handlePrint = async () => {
    if (selectedProducts.length === 0) {
      toast.error(t('No products selected for printing'));
      return;
    }

    const labelItems = selectedProducts.map((product) => ({
      name: settings.showProductName ? product.name : '',
      price: settings.showProductPrice && product.selectedUnitQuantity ? formatCurrency(product.selectedUnitQuantity.sale_price) : undefined,
      barcode: product.barcode,
      sku: product.sku,
      unit: product.selectedUnitQuantity?.unit.name,
      copies: product.times || 1,
      storeName: settings.showStoreName ? 'ALWAFI' : undefined,
    }));

    try {
      const res = await PrintAgentService.printLabels(labelItems, {
        showStoreNameOnLabel: settings.showStoreName,
        showPriceOnLabel: settings.showProductPrice,
        showSkuOnLabel: false,
        barcodeHeight: settings.barcodeHeight || 45,
      });
      toast.success(res.message || t('Labels sent to thermal printer successfully!'));
    } catch (err: any) {
      toast.error(err.message || t('Failed to print labels.'));
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
        <LabelSettingsPanel settings={settings} onSettingsChange={setSettings} />
      </div>
    </AppLayout>
  );
}
