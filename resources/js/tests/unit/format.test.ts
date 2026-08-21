import { describe, expect, it } from 'vitest';
import { formatCurrency, rawCurrency, formatDate, formatDateTime } from '@/utils/format';
import Settings from '@/lib/settings';

describe('format utilities', () => {
    describe('formatCurrency', () => {
        it('formats currency with default settings ($)', () => {
            const result = formatCurrency(1250.5);
            expect(result).toBe('$1,250.50');
        });

        it('respects custom currency settings', () => {
            Settings.set({
                identification: {} as any,
                registration: {} as any,
                date: {} as any,
                currency: {
                    ns_currency_symbol: ' SAR',
                    ns_currency_iso: 'SAR',
                    ns_currency_position: 'after',
                    ns_currency_prefered: 'SAR',
                    ns_currency_thousand_separator: ',',
                    ns_currency_decimal_separator: '.',
                    ns_currency_precision: 2,
                },
            });

            const result = formatCurrency(500);
            expect(result).toBe('500.00 SAR');
        });

        it('handles 0 and invalid inputs gracefully', () => {
            expect(formatCurrency(0)).toBe('0.00 SAR');
            expect(formatCurrency(NaN as any)).toBe('0.00 SAR');
        });
    });

    describe('rawCurrency', () => {
        it('parses raw numbers from currency strings', () => {
            expect(rawCurrency('1,250.50')).toBe(1250.5);
            expect(rawCurrency(99.99)).toBe(99.99);
        });
    });

    describe('formatDate and formatDateTime', () => {
        it('formats standard ISO date strings', () => {
            Settings.set({
                identification: {} as any,
                registration: {} as any,
                currency: {} as any,
                date: {
                    ns_date_format: 'Y-m-d',
                    ns_datetime_format: 'Y-m-d H:i',
                    ns_datetime_timezone: 'UTC',
                },
            });

            const formatted = formatDate('2026-08-21T01:30:00Z');
            expect(formatted).toBe('2026-08-21');
        });

        it('returns empty string for empty inputs', () => {
            expect(formatDate('')).toBe('');
            expect(formatDateTime('')).toBe('');
        });
    });
});
