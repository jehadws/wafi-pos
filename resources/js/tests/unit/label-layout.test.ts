import { describe, expect, it } from 'vitest';
import { layoutTsplLabel } from '@/pages/dashboard/products/print-labels/label-layout';

// Geometry mirrors print-agent/label-builder.js; these coordinates are the values the agent emits
// for the same payload (verified with node -e "require('./label-builder').layoutTsplLabel(...)").
const label = { storeName: 'SUBUL', name: 'LATTE', price: 'SAR 12.00', barcode: '123456789012' };

describe('layoutTsplLabel', () => {
  it('spreads independently scaled rows over a 50x30 mm sticker', () => {
    const layout = layoutTsplLabel(label, {
      widthMm: 50,
      heightMm: 30,
      barcodeHeightDots: 48,
      showStoreName: true,
      showPrice: true,
      showSku: false,
      showBarcodeText: true,
    });

    expect(layout.widthDots).toBe(400);
    expect(layout.heightDots).toBe(240);
    expect(layout.rows.map((r) => [r.x, r.y])).toEqual([
      [180, 8],
      [140, 32],
      [48, 88],
      [56, 168],
    ]);

    const priceRow = layout.rows.at(-1);
    expect(priceRow?.type === 'text' && priceRow.text).toBe('SAR 12.00');
  });

  it('shrinks the barcode instead of overflowing a 40x25 mm sticker', () => {
    const layout = layoutTsplLabel(label, {
      widthMm: 40,
      heightMm: 25,
      barcodeHeightDots: 96,
      showStoreName: true,
      showPrice: true,
      showSku: false,
      showBarcodeText: true,
    });

    const barcode = layout.rows.find((r) => r.type === 'barcode');
    expect(barcode?.height).toBe(64);
    expect(layout.overflow).toBe(false);
  });

  it('scales text up on large stickers', () => {
    const layout = layoutTsplLabel({ name: 'LATTE' }, {
      widthMm: 76,
      heightMm: 50,
      barcodeHeightDots: 48,
      showStoreName: false,
      showPrice: false,
      showSku: false,
      showBarcodeText: false,
    });

    expect(layout.scale).toBeGreaterThan(1);
  });

  it('wraps a long product name onto two lines instead of truncating', () => {
    const layout = layoutTsplLabel(
      { storeName: 'SUBUL', name: 'ESPRESSO CAPPUCINO GRANDE', price: 'SAR 25.50', barcode: '6291041500213' },
      {
        widthMm: 60,
        heightMm: 40,
        barcodeHeightDots: 48,
        showStoreName: true,
        showPrice: true,
        showSku: false,
        showBarcodeText: true,
      },
    );

    const nameLines = layout.rows.filter((r) => r.type === 'text' && (r.text === 'ESPRESSO CAPPUCINO' || r.text === 'GRANDE'));
    expect(nameLines).toHaveLength(2);
    expect(layout.overflow).toBe(false);
  });
});
