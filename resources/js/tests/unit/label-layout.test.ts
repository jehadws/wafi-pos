import { layoutLabel } from '@/lib/label-layout';
import { describe, expect, it } from 'vitest';

// Geometry mirrors LabelBuilder::layout(); the backend measures real Tahoma glyph
// boxes while this mirror approximates them, so these tests pin the structure the
// two share — role ladder, wrapping, shrink-to-fit — rather than exact dot values.
const label = { storeName: 'SUBUL', name: 'LATTE', price: 'SAR 12.00', barcode: '123456789012' };

const options = {
  barcodeHeightDots: 48,
  showStoreName: true,
  showPrice: true,
  showSku: false,
  showBarcodeText: true,
};

describe('layoutLabel', () => {
  it('lays the receipt role ladder over a 50x30 mm sticker', () => {
    const layout = layoutLabel(label, { ...options, widthMm: 50, heightMm: 30 });

    expect(layout.widthDots).toBe(400);
    expect(layout.heightDots).toBe(240);
    expect(layout.overflow).toBe(false);
    expect(layout.rows.map((row) => row.type)).toEqual(['text', 'text', 'barcode', 'text']);

    const [store, name, , price] = layout.rows;
    expect(store?.type === 'text' && store.text).toBe('SUBUL');
    expect(store?.type === 'text' && store.bold).toBe(true);
    expect(name?.type === 'text' && name.px).toBe(23);
    expect(price?.type === 'text' && price.px).toBe(30);
    expect(store?.type === 'text' && store.px).toBe(18);
    expect(layout.rows[2]?.type === 'barcode' && layout.rows[2].readablePx).toBe(17);

    const ys = layout.rows.map((row) => row.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  it('keeps roles proportional when a wider head raises the base', () => {
    const small = layoutLabel(label, { ...options, widthMm: 50, heightMm: 30 });
    const large = layoutLabel(label, { ...options, widthMm: 76, heightMm: 50 });

    const smallPrice = small.rows.find((row) => row.type === 'text' && row.text === label.price);
    const largePrice = large.rows.find((row) => row.type === 'text' && row.text === label.price);
    expect(smallPrice?.type === 'text' && smallPrice.px).toBe(30);
    expect(largePrice?.type === 'text' && largePrice.px).toBe(35);
  });

  it('wraps a long product name onto two lines instead of truncating', () => {
    const layout = layoutLabel({ name: 'ESPRESSO CAPPUCCINO GRANDE MORNING' }, { ...options, widthMm: 50, heightMm: 30, showStoreName: false, showPrice: false });

    const lines = layout.rows.filter((row) => row.type === 'text');
    expect(lines.map((row) => (row.type === 'text' ? row.text : ''))).toEqual(['ESPRESSO CAPPUCCINO', 'GRANDE MORNING']);
    expect(layout.overflow).toBe(false);
  });

  it('shrinks the barcode instead of overflowing a 40x25 mm sticker', () => {
    const layout = layoutLabel(label, { ...options, widthMm: 40, heightMm: 25, barcodeHeightDots: 96 });

    const barcode = layout.rows.find((row) => row.type === 'barcode');
    expect(barcode?.type === 'barcode' && barcode.height).toBeLessThan(96);
    expect(barcode?.type === 'barcode' && barcode.height).toBeGreaterThanOrEqual(16);
    expect(layout.overflow).toBe(false);
  });

  it('draws the unit as its own line under the price', () => {
    const layout = layoutLabel({ ...label, unit: 'قطعة' }, { ...options, widthMm: 50, heightMm: 30 });

    const last = layout.rows.at(-1);
    expect(last?.type === 'text' && last.text).toBe('قطعة');
    expect(last?.type === 'text' && last.bold).toBe(false);
  });
});
