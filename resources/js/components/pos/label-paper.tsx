'use client';

import { BarcodeStrip } from '@/components/pos/barcode-strip';
import { useTranslation } from '@/lib/i18n';
import { LabelLayoutOptions, LabelPayload, layoutTsplLabel } from '@/lib/label-layout';
import { cn } from '@/lib/utils';
import { LabelPreviewImage } from '@/services/printing-service';
import { useState } from 'react';

/** Preview scale: printer dots -> css pixels, so a 76 mm sticker renders wider than a 40 mm one. */
export const LABEL_PX_PER_DOT = 0.6;
const MONOSPACE_ADVANCE = 0.6;
const BARCODE_TEXT_DOTS = 24;

/**
 * Draws one sticker. When the backend has rendered it, the printed pixels are shown
 * verbatim; until then the TSPL geometry from layoutTsplLabel() (which mirrors
 * LabelBuilder::layout()) stands in so the shape of the label is right early.
 */
export function LabelPaper({
  label,
  options,
  image,
  className,
}: {
  label: LabelPayload;
  options: LabelLayoutOptions;
  image?: LabelPreviewImage | null;
  className?: string;
}) {
  const { t } = useTranslation();
  // Products without a generated barcode image still show where their bars land.
  const [barcodeImageFailed, setBarcodeImageFailed] = useState(false);
  const layout = layoutTsplLabel(label, options);

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        dir="ltr"
        className="relative shrink-0 overflow-hidden border border-neutral-300 bg-white shadow-sm"
        style={{ width: `${layout.widthDots * LABEL_PX_PER_DOT}px`, height: `${layout.heightDots * LABEL_PX_PER_DOT}px` }}
      >
        {image ? (
          <img src={image.image} alt="" className="block h-full w-full origin-top-left" style={{ imageRendering: 'pixelated' }} />
        ) : (
          layout.rows.map((row, index) =>
            row.type === 'barcode' ? (
              <div
                key={index}
                className="absolute flex flex-col items-center justify-center"
                style={{ left: `${row.x * LABEL_PX_PER_DOT}px`, top: `${row.y * LABEL_PX_PER_DOT}px`, width: `${row.width * LABEL_PX_PER_DOT}px` }}
              >
                {barcodeImageFailed ? (
                  <BarcodeStrip value={row.code} height={row.height * LABEL_PX_PER_DOT} showText={false} className="w-full" />
                ) : (
                  <img
                    src={`/storage/products/barcodes/${row.code}.png`}
                    alt=""
                    className="object-contain"
                    style={{ width: `${row.width * LABEL_PX_PER_DOT}px`, height: `${row.height * LABEL_PX_PER_DOT}px` }}
                    onError={() => setBarcodeImageFailed(true)}
                  />
                )}
                {row.readable && (
                  <span className="leading-none text-black" style={{ fontSize: `${BARCODE_TEXT_DOTS * LABEL_PX_PER_DOT * 0.8}px` }}>
                    {row.code}
                  </span>
                )}
              </div>
            ) : (
              <div
                key={index}
                className="absolute overflow-hidden text-center font-mono leading-none text-black"
                style={{
                  left: `${row.x * LABEL_PX_PER_DOT}px`,
                  top: `${row.y * LABEL_PX_PER_DOT}px`,
                  width: `${row.width * LABEL_PX_PER_DOT}px`,
                  fontSize: `${Math.min(
                    row.height * LABEL_PX_PER_DOT * 0.82,
                    (row.width * LABEL_PX_PER_DOT) / (row.text.length * MONOSPACE_ADVANCE),
                  )}px`,
                }}
              >
                {row.text}
              </div>
            ),
          )
        )}
      </div>

      {(image?.overflow ?? layout.overflow) && <p className="text-danger text-xs">{t('Content may not fit this label size')}</p>}
    </div>
  );
}
