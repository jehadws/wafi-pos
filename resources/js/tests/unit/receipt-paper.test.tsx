/**
 * tests/unit/receipt-paper.test.tsx
 *
 * The preview must keep the geometry ReceiptBuilder/EscPosBuilder emit, or the
 * cashier reads one layout on screen and another on paper. productRow() reserves
 * 6 chars for QTY and 14 for TOTAL out of the printable width.
 */
import { ReceiptPaper } from '@/components/pos/receipt-paper';
import { DEFAULT_PRINTER_SETTINGS, FormattedReceiptData } from '@/services/printing-service';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

// Amounts arrive as numbers and read with the store's currency: uninitialized app
// settings fall back to $/2 decimals, the same defaults the backend prints with.
const data: FormattedReceiptData = {
  storeName: 'Subul Market',
  orderCode: 'SUL-000148',
  items: [{ name: 'Medjool Dates 500g', quantity: 2, price: 18.75, total: 37.5 }],
  subtotal: 87,
  tax: 12.3,
  taxes: [{ name: 'VAT', rate: 15, tax_value: 12.3 }],
  total: 94.3,
  tendered: 100,
  change: 5.7,
  barcode: 'SUL-000148',
};

const settings = (overrides: Partial<typeof DEFAULT_PRINTER_SETTINGS> = {}) => ({ ...DEFAULT_PRINTER_SETTINGS, ...overrides });

const paper = () => document.querySelector('[data-paper]') as HTMLElement;

describe('components/pos/receipt-paper', () => {
  it('widens the paper with the terminal printable width', () => {
    render(<ReceiptPaper data={data} settings={settings({ lineWidth: 32 })} />);
    expect(paper().style.width).toBe('calc(32ch + 2rem)');

    render(<ReceiptPaper data={data} settings={settings({ lineWidth: 48 })} />);
    const papers = document.querySelectorAll('[data-paper]');
    expect((papers[1] as HTMLElement).style.width).toBe('calc(48ch + 2rem)');
  });

  it('keeps the product columns at the printed proportions', () => {
    render(<ReceiptPaper data={data} settings={settings({ lineWidth: 42 })} />);

    const name = screen.getByText('Medjool Dates 500g');
    const quantity = screen.getByText('2x');
    const total = screen.getByText('$37.50');

    expect((name.parentElement as HTMLElement).style.gridTemplateColumns).toBe('22ch 6ch 14ch');
    expect(quantity.tagName).toBe('SPAN');
    expect(total.textContent).toBe('$37.50');
    expect(screen.getByText('@ $18.75')).toBeTruthy();
  });

  it('prints per-tax lines only when the tax breakdown is enabled', () => {
    const { unmount } = render(<ReceiptPaper data={data} settings={settings({ showTaxBreakdown: true })} />);
    expect(screen.getByText('VAT (15%)')).toBeTruthy();
    expect(screen.queryByText('Tax')).toBeNull();
    unmount();

    render(<ReceiptPaper data={data} settings={settings({ showTaxBreakdown: false })} />);
    expect(screen.getByText('Tax')).toBeTruthy();
    expect(screen.queryByText('VAT (15%)')).toBeNull();
  });

  it('shows the cut cue the builder sends, and the feed cue when cutting is off', () => {
    const { unmount } = render(<ReceiptPaper data={data} settings={settings({ cutPaper: true })} />);
    expect(screen.getByText('Cut')).toBeTruthy();
    unmount();

    render(<ReceiptPaper data={data} settings={settings({ cutPaper: false })} />);
    expect(screen.getByText('No cut — feeds 3 lines')).toBeTruthy();
  });
});
