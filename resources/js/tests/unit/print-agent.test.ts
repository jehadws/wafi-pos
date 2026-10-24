import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios');

vi.mock('@/api/http', () => {
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    http: mockInstance,
    refreshCsrfToken: vi.fn(),
  };
});

import { PrintAgentService } from '@/services/print-agent-service';
const mockedAxios = vi.mocked(axios, true);

describe('PrintAgentService', () => {
  let service: PrintAgentService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    service = new PrintAgentService();
  });

  describe('checkStatus', () => {
    it('returns online status when agent responds', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { status: 'online', version: '1.0.0', service: 'Subul Windows Print Agent' },
      });

      const status = await service.checkStatus(true);
      expect(status.status).toBe('online');
      expect(status.version).toBe('1.0.0');
    });

    it('gracefully returns offline status when agent is unreachable', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

      const status = await service.checkStatus(true);
      expect(status.status).toBe('offline');
    });

    it('caches status to prevent hammering within TTL', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { status: 'online' },
      });

      await service.checkStatus(true);
      await service.checkStatus(false);

      // Second call should use cache
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('printOrderReceipt price mapping', () => {
    const makeOrder = (products: any[]) =>
      ({
        code: 'ORD-55',
        created_at: new Date().toISOString(),
        subtotal: 200,
        discount: 0,
        tax_value: 0,
        total: 200,
        products,
      }) as any;

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

    it('maps with-tax item prices by default', async () => {
      service.saveSettings({ receiptPrinter: 'XP-80C' });
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      await service.printOrderReceipt(makeOrder([lineItem]));

      const payload = mockedAxios.post.mock.calls[0][1] as any;
      expect(payload.data.items[0].price).toContain('115.00');
      expect(payload.data.items[0].total).toContain('230.00');
    });

    it('maps without-tax item prices when priceWithTax is false', async () => {
      service.saveSettings({ receiptPrinter: 'XP-80C' });
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      await service.printOrderReceipt(makeOrder([lineItem]), 'sale', {}, false);

      const payload = mockedAxios.post.mock.calls[0][1] as any;
      expect(payload.data.items[0].price).toContain('100.00');
      expect(payload.data.items[0].total).toContain('200.00');
    });
  });

  describe('printReceipt', () => {
    it('prints to the Windows default printer when no printer is configured', async () => {
      service.saveSettings({ receiptPrinter: '' });
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          printers: [
            { name: 'XP-80C', isDefault: false },
            { name: 'Xprinter XP-D365B', isDefault: true },
          ],
        },
      });
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await service.printReceipt({ orderCode: 'ORD-1', total: '10.00', items: [] });

      expect(result.success).toBe(true);
      expect((mockedAxios.post.mock.calls[0][1] as any).printer).toBe('Xprinter XP-D365B');
    });

    it('returns success: false when no printer is configured and Windows has no default', async () => {
      service.saveSettings({ receiptPrinter: '' });
      mockedAxios.get.mockResolvedValueOnce({ data: { printers: [{ name: 'XP-80C', isDefault: false }] } });

      const result = await service.printReceipt({
        orderCode: 'ORD-123',
        total: '100.00',
        items: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No default printer');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('uses the configured printer without looking up the Windows default', async () => {
      service.saveSettings({ receiptPrinter: 'XP-80C' });
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      await service.printReceipt({ orderCode: 'ORD-2', total: '10.00', items: [] });

      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect((mockedAxios.post.mock.calls[0][1] as any).printer).toBe('XP-80C');
    });

    it('handles agent timeout gracefully without throwing', async () => {
      service.saveSettings({ receiptPrinter: 'XP-80C' });
      const timeoutError: any = new Error('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      mockedAxios.post.mockRejectedValueOnce(timeoutError);

      const result = await service.printReceipt({
        orderCode: 'ORD-999',
        total: '50.00',
        items: [],
      });

      expect(result.success).toBe(false);
      expect(result.isOffline).toBe(true);
      expect(result.error).toContain('timed out');
    });

    it('returns success: true when agent accepts print job', async () => {
      service.saveSettings({ receiptPrinter: 'XP-80C' });
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, jobId: 'rcpt_123' },
      });

      const result = await service.printReceipt({
        orderCode: 'ORD-777',
        total: '75.00',
        items: [{ name: 'Item A', quantity: 1, total: '75.00' }],
      });

      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
    });
  });

  describe('formatErrorMessage', () => {
    it('formats agent offline error when no response is received', () => {
      const err = new Error('Connection refused');
      const formatted = service.formatErrorMessage(err);
      expect(formatted).toContain('Print Agent is not running');
    });

    it('formats timeout error', () => {
      const err: any = new Error('timeout');
      err.code = 'ECONNABORTED';
      const formatted = service.formatErrorMessage(err);
      expect(formatted).toContain('timed out');
    });

    it('extracts custom server error message if present', () => {
      const err: any = {
        response: { data: { error: 'Paper out' } },
      };
      const formatted = service.formatErrorMessage(err);
      expect(formatted).toBe('Paper out');
    });
  });
});
