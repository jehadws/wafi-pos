/**
 * tests/unit/product-units.test.ts
 *
 * Product clicks must resolve unit quantities from the preloaded category
 * payload without a network round-trip. The units API applies the backend
 * visible() scope, which the category eager load does not — the resolver
 * must mirror it before the payload is preferred.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveProductUnitQuantities } from '@/services/product-units';
import { productsApi } from '@/api';

vi.mock('@/api', () => ({
    productsApi: { getUnitQuantities: vi.fn() },
}));

const visibleUnit = { id: 1, quantity: 5, sale_price: 10, type: 'piece', unit: { id: 3, name: 'pcs' } } as any;
const hiddenUnit = { id: 2, quantity: 9, sale_price: 90, type: 'box', visible: 0, unit: { id: 4, name: 'box' } } as any;

describe('services/product-units.ts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('prefers the preloaded unit_quantities payload — no API call', async () => {
        const product = { id: 7, unit_quantities: [visibleUnit, hiddenUnit] } as any;

        const units = await resolveProductUnitQuantities(product);

        expect(productsApi.getUnitQuantities).not.toHaveBeenCalled();
        expect(units).toEqual([visibleUnit]);
    });

    it('filters invisible units — mirrors ProductUnitQuantity::scopeVisible', async () => {
        const explicitVisible = { ...visibleUnit, id: 3, visible: 1 };
        const product = { id: 7, unit_quantities: [visibleUnit, hiddenUnit, explicitVisible] } as any;

        const units = await resolveProductUnitQuantities(product);

        expect(units.map((u) => u.id)).toEqual([1, 3]);
    });

    it('treats a missing visible flag as visible', async () => {
        const product = { id: 7, unit_quantities: [visibleUnit] } as any;

        const units = await resolveProductUnitQuantities(product);

        expect(units).toEqual([visibleUnit]);
    });

    it('falls back to the units API when the payload omitted unit_quantities', async () => {
        vi.mocked(productsApi.getUnitQuantities).mockResolvedValueOnce([visibleUnit] as any);
        const product = { id: 7 } as any;

        const units = await resolveProductUnitQuantities(product);

        expect(productsApi.getUnitQuantities).toHaveBeenCalledTimes(1);
        expect(productsApi.getUnitQuantities).toHaveBeenCalledWith(7);
        expect(units).toEqual([visibleUnit]);
    });
});
