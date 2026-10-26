import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/printing', () => ({
  printingApi: {
    status: vi.fn(),
    printers: vi.fn(),
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
    printReceipt: vi.fn(),
    printLabels: vi.fn(),
    test: vi.fn(),
    openDrawer: vi.fn(),
  },
}));

import { printingApi } from '@/api/printing';
import { DEFAULT_PRINTER_SETTINGS, PrintingService } from '@/services/printing-service';

const api = printingApi as unknown as Record<string, ReturnType<typeof vi.fn>>;

const httpError = (status: number | null, message: string, data?: any) =>
  Object.assign(new Error(message), status === null ? { code: 'ECONNABORTED' } : { response: { status, data } });

describe('PrintingService', () => {
  let service: PrintingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PrintingService();
  });

  describe('settings', () => {
    it('hydrates the terminal settings once and fills gaps with defaults', async () => {
      api.getSettings.mockResolvedValueOnce({ success: true, settings: { receiptPrinter: 'XP-80C', copies: 2 } });

      const first = await service.loadSettings();
      const second = await service.loadSettings();

      expect(api.getSettings).toHaveBeenCalledTimes(1);
      expect(first.receiptPrinter).toBe('XP-80C');
      expect(first.copies).toBe(2);
      expect(first.lineWidth).toBe(DEFAULT_PRINTER_SETTINGS.lineWidth);
      expect(second).toEqual(first);
    });

    it('refetches settings when the caller asks for a refresh', async () => {
      api.getSettings.mockResolvedValue({ success: true, settings: {} });

      await service.loadSettings();
      await service.loadSettings(true);

      expect(api.getSettings).toHaveBeenCalledTimes(2);
    });

    it('lets a failed hydration be retried', async () => {
      api.getSettings.mockRejectedValueOnce(httpError(null, 'offline'));
      await expect(service.loadSettings()).rejects.toThrow('offline');
      api.getSettings.mockResolvedValueOnce({ success: true, settings: { labelPrinter: 'XP-D365B' } });

      expect((await service.loadSettings()).labelPrinter).toBe('XP-D365B');
    });

    it('adopts the settings the server echoes back after a save', async () => {
      api.saveSettings.mockResolvedValueOnce({ success: true, settings: { ...DEFAULT_PRINTER_SETTINGS, cutPaper: false } });

      const saved = await service.saveSettings({ cutPaper: false });

      expect(api.saveSettings).toHaveBeenCalledWith({ cutPaper: false });
      expect(saved.cutPaper).toBe(false);
      expect(service.getSettings().cutPaper).toBe(false);
    });
  });

  describe('printer discovery', () => {
    it('reports offline instead of throwing when the API is unreachable', async () => {
      api.status.mockRejectedValueOnce(httpError(null, 'down'));

      expect(await service.checkStatus()).toEqual({ status: 'offline' });
    });

    it('returns the printers listed by the backend', async () => {
      api.printers.mockResolvedValueOnce({ printers: [{ name: 'XP-80C', isDefault: true }] });

      expect(await service.getPrinters(true)).toEqual([{ name: 'XP-80C', isDefault: true }]);
      expect(api.printers).toHaveBeenCalledWith(true);
    });
  });

  describe('legacy localStorage settings', () => {
    const serverDefaults = { ...DEFAULT_PRINTER_SETTINGS, receiptPrinter: '', labelPrinter: '' };

    beforeEach(() => {
      localStorage.clear();
    });

    it('adopts a printer saved by an older build when the server has none', async () => {
      localStorage.setItem('pos_direct_printer_settings', JSON.stringify({ agentUrl: 'http://127.0.0.1:8189', receiptPrinter: 'XP-80C', copies: 3 }));
      api.getSettings.mockResolvedValueOnce({ settings: serverDefaults });
      api.saveSettings.mockResolvedValueOnce({ settings: { ...serverDefaults, receiptPrinter: 'XP-80C', copies: 3 } });

      const settings = await service.loadSettings();

      expect(api.saveSettings).toHaveBeenCalledWith({ receiptPrinter: 'XP-80C', copies: 3 });
      expect(settings.receiptPrinter).toBe('XP-80C');
      expect(localStorage.getItem('pos_direct_printer_settings')).toBeNull();
    });

    it('never overwrites a printer the terminal already configured', async () => {
      localStorage.setItem('pos_direct_printer_settings', JSON.stringify({ receiptPrinter: 'Old Driver' }));
      api.getSettings.mockResolvedValueOnce({ settings: { ...serverDefaults, receiptPrinter: 'XP-80C' } });

      await service.loadSettings();

      expect(api.saveSettings).not.toHaveBeenCalled();
      expect(localStorage.getItem('pos_direct_printer_settings')).toBeNull();
    });

    it('drops a legacy blob that names no printer', async () => {
      localStorage.setItem('pos_direct_printer_settings', JSON.stringify({ lineWidth: 46 }));
      api.getSettings.mockResolvedValueOnce({ settings: serverDefaults });

      await service.loadSettings();

      expect(api.saveSettings).not.toHaveBeenCalled();
      expect(localStorage.getItem('pos_direct_printer_settings')).toBeNull();
    });
  });

  describe('printOrderReceipt price mapping', () => {
    const lineItem = {
      name: 'Latte',
      quantity: 2,
      unit_price: 100,
      price_with_tax: 115,
      price_without_tax: 100,
      total_price: 230,
      total_price_with_tax: 230,
      total_price_without_tax: 200,
    };

    const makeOrder = () =>
      ({
        code: 'ORD-55',
        created_at: new Date().toISOString(),
        subtotal: 200,
        discount: 0,
        tax_value: 0,
        total: 200,
        products: [lineItem],
      }) as any;

    it('maps with-tax item prices by default', async () => {
      api.printReceipt.mockResolvedValueOnce({ success: true });

      await service.printOrderReceipt(makeOrder());

      const payload = api.printReceipt.mock.calls[0][0] as any;
      expect(payload.data.items[0].price).toContain('115.00');
      expect(payload.data.items[0].total).toContain('230.00');
    });

    it('maps without-tax item prices when priceWithTax is false', async () => {
      api.printReceipt.mockResolvedValueOnce({ success: true });

      await service.printOrderReceipt(makeOrder(), 'sale', {}, false);

      const payload = api.printReceipt.mock.calls[0][0] as any;
      expect(payload.data.items[0].price).toContain('100.00');
      expect(payload.data.items[0].total).toContain('200.00');
    });

    it('sends no config so the backend applies the stored settings', async () => {
      api.printReceipt.mockResolvedValueOnce({ success: true });

      const result = await service.printOrderReceipt(makeOrder());

      const payload = api.printReceipt.mock.calls[0][0] as any;
      expect(payload.printer).toBeUndefined();
      expect(payload.config).toEqual({});
      expect(result.success).toBe(true);
      expect(result.jobId).toMatch(/^rcpt_ORD-55_/);
    });

    it('sends the caller job id so a retry is recognised by the backend', async () => {
      api.printReceipt.mockResolvedValueOnce({ success: true });

      const result = await service.printOrderReceipt(makeOrder(), 'sale', {}, true, 'rcpt_ORD-55_fixed');

      expect((api.printReceipt.mock.calls[0][0] as any).jobId).toBe('rcpt_ORD-55_fixed');
      expect(result.jobId).toBe('rcpt_ORD-55_fixed');
    });
  });

  describe('printReceipt', () => {
    it('passes only the overrides the caller set', async () => {
      api.printReceipt.mockResolvedValueOnce({ success: true, printer: 'XP-80C' });

      const result = await service.printReceipt({ orderCode: 'ORD-1', total: '10.00', items: [] }, { receiptPrinter: 'XP-80C', copies: 2 });

      const payload = api.printReceipt.mock.calls[0][0] as any;
      expect(payload.printer).toBe('XP-80C');
      expect(payload.config).toEqual({ copies: 2 });
      expect(result.printer).toBe('XP-80C');
    });

    it('resolves a failed print with the message the backend returned', async () => {
      api.printReceipt.mockRejectedValueOnce(httpError(422, 'Unprocessable', { message: 'Windows has no default printer configured.' }));

      const result = await service.printReceipt({ orderCode: 'ORD-2', total: '10.00', items: [] });

      expect(result).toMatchObject({ success: false, error: 'Windows has no default printer configured.', isOffline: false });
    });

    it('flags a timed out print as unreachable', async () => {
      api.printReceipt.mockRejectedValueOnce(httpError(null, 'timeout of 10000ms exceeded'));

      const result = await service.printReceipt({ orderCode: 'ORD-9', total: '50.00', items: [] });

      expect(result.success).toBe(false);
      expect(result.isOffline).toBe(true);
      expect(result.error).toContain('timed out');
    });
  });

  describe('printLabels', () => {
    it('maps label overrides onto the config keys the builder reads', async () => {
      api.printLabels.mockResolvedValueOnce({ success: true, totalLabelsPrinted: 3 });

      await service.printLabels([{ name: 'Coffee', barcode: '123', copies: 3 }], {
        labelPrinter: 'XP-D365B',
        labelWidthMm: 60,
        labelHeightMm: 40,
        barcodeHeight: 40,
        showBarcodeTextOnLabel: false,
      });

      const payload = api.printLabels.mock.calls[0][0] as any;
      expect(payload.printer).toBe('XP-D365B');
      expect(payload.config).toEqual({ widthMm: 60, heightMm: 40, barcodeHeight: 40, showBarcodeText: false });
    });

    it('returns a failure result instead of throwing', async () => {
      api.printLabels.mockRejectedValueOnce(httpError(500, 'Server error', { message: 'The printer name is invalid' }));

      const result = await service.printLabels([{ name: 'Tea', barcode: '456' }]);

      expect(result).toMatchObject({ success: false, error: 'The printer name is invalid' });
      expect(result.jobId).toMatch(/^lbl_/);
    });
  });

  describe('testPrinter', () => {
    it('throws a toast-ready message when the test print fails', async () => {
      api.test.mockRejectedValueOnce(httpError(500, 'Server error', { message: 'Paper out' }));

      await expect(service.testPrinter('XP-80C', 'receipt', 'arabic')).rejects.toThrow('Paper out');
      expect(api.test).toHaveBeenCalledWith({ printer: 'XP-80C', type: 'receipt', sample: 'arabic' });
    });
  });

  describe('openCashDrawer', () => {
    it('kicks the drawer on the configured printer', async () => {
      api.openDrawer.mockResolvedValueOnce({ success: true, message: 'Cash drawer opened successfully.' });

      expect(await service.openCashDrawer()).toMatchObject({ success: true });
      expect(api.openDrawer).toHaveBeenCalledWith({ printer: undefined });
    });
  });

  describe('formatErrorMessage', () => {
    it('explains an unreachable printing service', () => {
      expect(service.formatErrorMessage({})).toContain('could not be reached');
    });

    it('explains a timeout separately', () => {
      expect(service.formatErrorMessage({ code: 'ECONNABORTED' })).toContain('timed out');
    });

    it('falls back to the generic error text', () => {
      expect(service.formatErrorMessage({ response: {}, message: 'Socket hang up' })).toBe('Socket hang up');
    });
  });
});
