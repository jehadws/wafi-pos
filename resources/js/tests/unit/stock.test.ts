import { describe, expect, it } from 'vitest';
import { validateStockAvailability } from '@/services/stock';

describe('services/stock.ts', () => {
    it('blocks 0 stock from being added or treated as unlimited', () => {
        const result = validateStockAvailability(0, 1, 0);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('out of stock');
    });

    it('blocks negative requested quantity', () => {
        const result = validateStockAvailability(10, 0, 0);
        expect(result.allowed).toBe(false);
    });

    it('allows stock when within available limits', () => {
        const result = validateStockAvailability(10, 5, 2);
        expect(result.allowed).toBe(true);
    });

    it('blocks when cart quantity + requested quantity exceeds available stock', () => {
        const result = validateStockAvailability(10, 6, 5);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Not enough stock');
    });

    it('allows addition for products with untracked stock (null / undefined)', () => {
        const resultNull = validateStockAvailability(null, 100, 50);
        expect(resultNull.allowed).toBe(true);

        const resultUndefined = validateStockAvailability(undefined, 100, 50);
        expect(resultUndefined.allowed).toBe(true);
    });
});
