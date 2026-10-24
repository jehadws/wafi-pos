import { useTranslation } from '@/lib/i18n';
import { layoutTsplLabel, PRINT_DOTS_PER_MM } from '../label-layout';
import { buildLabelItems, getStoreName, LabelSettings, SelectedProduct } from '../page';

interface LabelPreviewProps {
  products: SelectedProduct[];
  settings: LabelSettings;
}

// Preview scale: printer dots -> css pixels, so a 76 mm sticker renders wider than a 40 mm one.
const PX_PER_DOT = 0.6;
const MONOSPACE_ADVANCE = 0.6;
const BARCODE_TEXT_DOTS = 24;

export function LabelPreview({ products, settings }: LabelPreviewProps) {
  const { t } = useTranslation();
  const storeName = getStoreName();

  const items = buildLabelItems(products, settings, storeName);
  const labels = items.flatMap((item) => Array.from({ length: item.copies }, () => item));

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

  const layoutOptions = {
    widthMm: settings.widthMm,
    heightMm: settings.heightMm,
    barcodeHeightDots: Math.round(settings.barcodeHeightMm * PRINT_DOTS_PER_MM),
    showStoreName: settings.showStoreName,
    showPrice: settings.showProductPrice,
    showSku: false,
    showBarcodeText: settings.showBarcodeText,
  };

  return (
    <div className="bg-muted flex-1 overflow-y-auto p-4">
      <p className="mb-3 text-sm text-gray-600">
        {t('Preview')} — {settings.widthMm} × {settings.heightMm} mm · {labels.length} {t('labels')}
      </p>
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${settings.itemsPerRow}, ${settings.widthMm * PRINT_DOTS_PER_MM * PX_PER_DOT}px)`,
          padding: `${settings.verticalPadding}px ${settings.horizontalPadding}px`,
        }}
      >
        {labels.map((item, index) => {
          const layout = layoutTsplLabel(item, layoutOptions);

          return (
            <div key={`${item.barcode}-${index}`} className="flex flex-col items-center gap-1">
              <div
                dir="ltr"
                className="relative overflow-hidden border border-gray-300 bg-white"
                style={{ width: `${layout.widthDots * PX_PER_DOT}px`, height: `${layout.heightDots * PX_PER_DOT}px` }}
              >
                {layout.rows.map((row, rowIndex) =>
                  row.type === 'barcode' ? (
                    <div
                      key={rowIndex}
                      className="absolute flex flex-col items-center justify-center"
                      style={{
                        left: `${row.x * PX_PER_DOT}px`,
                        top: `${row.y * PX_PER_DOT}px`,
                        width: `${row.width * PX_PER_DOT}px`,
                      }}
                    >
                      <img
                        src={`/storage/products/barcodes/${row.code}.png`}
                        alt={row.code}
                        className="object-contain"
                        style={{ width: `${row.width * PX_PER_DOT}px`, height: `${row.height * PX_PER_DOT}px` }}
                      />
                      {row.readable && (
                        <span className="leading-none text-black" style={{ fontSize: `${BARCODE_TEXT_DOTS * PX_PER_DOT * 0.8}px` }}>
                          {row.code}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      key={rowIndex}
                      className="absolute overflow-hidden text-center font-mono leading-none text-black"
                      style={{
                        left: `${row.x * PX_PER_DOT}px`,
                        top: `${row.y * PX_PER_DOT}px`,
                        width: `${row.width * PX_PER_DOT}px`,
                        fontSize: `${Math.min(row.height * PX_PER_DOT * 0.82, (row.width * PX_PER_DOT) / (row.text.length * MONOSPACE_ADVANCE))}px`,
                      }}
                    >
                      {row.text}
                    </div>
                  ),
                )}
              </div>
              {layout.overflow && <p className="text-xs text-red-600">{t('Content may not fit this label size')}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
