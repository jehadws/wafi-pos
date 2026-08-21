import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { PrintAgentService } from '@/services/print-agent-service';

vi.mock('axios');
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
                data: { status: 'online', version: '1.0.0', service: 'wafi-print-agent' },
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

    describe('printReceipt', () => {
        it('returns success: false when no printer is configured', async () => {
            service.saveSettings({ receiptPrinter: '' });
            const result = await service.printReceipt({
                orderCode: 'ORD-123',
                total: '100.00',
                items: [],
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('No receipt printer selected');
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
