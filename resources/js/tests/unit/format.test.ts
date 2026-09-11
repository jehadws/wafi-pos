import Settings from '@/lib/settings';
import { formatCurrency, formatDate, formatDateTime, rawCurrency } from '@/utils/format';
import { describe, expect, it } from 'vitest';

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
          sb_currency_symbol: ' SAR',
          sb_currency_iso: 'SAR',
          sb_currency_position: 'after',
          sb_currency_prefered: 'SAR',
          sb_currency_thousand_separator: ',',
          sb_currency_decimal_separator: '.',
          sb_currency_precision: 2,
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
          sb_date_format: 'Y-m-d',
          sb_datetime_format: 'Y-m-d H:i',
          sb_datetime_timezone: 'UTC',
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

  describe('formatCurrency precision handling', () => {
    const baseCurrency = {
      sb_currency_symbol: '$',
      sb_currency_position: 'before',
      sb_currency_thousand_separator: ',',
      sb_currency_decimal_separator: '.',
    };

    const setCurrency = (precision: number | string | null) => {
      Settings.set({
        identification: {} as any,
        registration: {} as any,
        date: {} as any,
        currency: { ...baseCurrency, sb_currency_precision: precision } as any,
      });
    };

    it('renders no decimals when precision is explicitly 0', () => {
      setCurrency(0);
      expect(formatCurrency(1250.4)).toBe('$1,250');
    });

    it('renders no decimals when precision arrives as a string "0"', () => {
      setCurrency('0');
      expect(formatCurrency(1250.4)).toBe('$1,250');
    });

    it('falls back to 2 decimals when precision is null', () => {
      setCurrency(null);
      expect(formatCurrency(1250.5)).toBe('$1,250.50');
    });

    it('uses the configured number of decimals when valid', () => {
      setCurrency(3);
      expect(formatCurrency(1250.5)).toBe('$1,250.500');
    });

    it('falls back to 2 decimals for out-of-range precision', () => {
      setCurrency(9);
      expect(formatCurrency(1250.5)).toBe('$1,250.50');
    });
  });
});
