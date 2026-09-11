import { useTranslation } from '@/lib/i18n';
import { LabelSettings } from '../page';

interface SelectedProduct extends ProductSearchResult {
  times: number;
  selectedUnitQuantity: UnitQuantity | null;
}

interface LabelPreviewProps {
  products: SelectedProduct[];
  settings: LabelSettings;
}

export function LabelPreview({ products, settings }: LabelPreviewProps) {
  const { t } = useTranslation();
  const generateLabels = () => {
    const labels = [];
    for (const product of products) {
      for (let i = 0; i < product.times; i++) {
        labels.push(product);
      }
    }
    return labels;
  };

  const labels = generateLabels();

  if (labels.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg">{t('No products selected')}</p>
          <p className="text-sm text-gray-400">{t('Search and add products to start creating labels')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-muted flex flex-1 flex-col p-4"
      style={{
        padding: `${settings.verticalPadding}px ${settings.horizontalPadding}px`,
      }}
    >
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${settings.itemsPerRow}, 1fr)`,
        }}
      >
        {labels.map((product, index) => (
          <div
            key={`${product.id}-${index}`}
            className="border border-gray-300 bg-white p-3"
            style={{
              minHeight: '120px',
            }}
          >
            {settings.showStoreName && <div className="mb-2 text-center text-sm font-bold text-black">ALWAFI</div>}

            <div className="space-y-1 text-xs text-black">
              {settings.showProductName && (
                <div className="flex justify-between">
                  <span className="font-medium">{t('Product')}</span>
                  <span className="text-end">{product.name}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="font-medium">{t('Unit')}</span>
                <span className="text-end">{product.selectedUnitQuantity?.unit.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">{t('Barcode')}</span>
                <span className="text-end">{product.selectedUnitQuantity?.barcode}</span>
              </div>

              {settings.showProductPrice && (
                <div className="flex justify-between">
                  <span className="font-medium">{t('Price')}</span>
                  <span className="text-end">
                    {t('ly')}
                    {product.selectedUnitQuantity?.sale_price.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-2 flex w-full flex-col items-center justify-center">
              <img
                style={{ height: settings.barcodeHeight + 'px' }}
                src={`/storage/products/barcodes/${product.selectedUnitQuantity?.barcode}.png`}
                alt={product.selectedUnitQuantity?.barcode}
              />
              <div className="mt-1 text-center text-xs text-gray-500">{product.selectedUnitQuantity?.barcode}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
