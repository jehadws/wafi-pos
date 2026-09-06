import { describe, expect, it } from 'vitest';
import {
    canAddBarcodeSilently,
    pickDefaultOrderType,
    resolveDefaultCustomerId,
} from '@/services/pos-defaults';
import { POS_OPTION_KEYS } from '@/constants/pos-options';

describe('services/pos-defaults.ts', () => {
    describe('pickDefaultOrderType', () => {
        it('returns null when no types are enabled', () => {
            expect(pickDefaultOrderType([])).toBeNull();
            expect(pickDefaultOrderType(undefined)).toBeNull();
            expect(pickDefaultOrderType('takeaway')).toBeNull();
        });

        it('uses the single enabled type as the default', () => {
            expect(pickDefaultOrderType(['takeaway'])).toBe('takeaway');
            expect(pickDefaultOrderType(['delivery'])).toBe('delivery');
        });

        it('defaults to takeaway when both types are active', () => {
            expect(pickDefaultOrderType(['takeaway', 'delivery'])).toBe('takeaway');
            expect(pickDefaultOrderType(['delivery', 'takeaway'])).toBe('takeaway');
        });

        it('falls back to the first enabled type when takeaway is unavailable', () => {
            expect(pickDefaultOrderType(['delivery', 'dine_in'])).toBe('delivery');
        });
    });

    describe('resolveDefaultCustomerId', () => {
        it('accepts numeric and numeric-string ids', () => {
            expect(resolveDefaultCustomerId({ [POS_OPTION_KEYS.defaultCustomer]: 7 })).toBe(7);
            expect(resolveDefaultCustomerId({ [POS_OPTION_KEYS.defaultCustomer]: '7' })).toBe(7);
        });

        it('returns null for unset or invalid values', () => {
            expect(resolveDefaultCustomerId({})).toBeNull();
            expect(
                resolveDefaultCustomerId({ [POS_OPTION_KEYS.defaultCustomer]: false }),
            ).toBeNull();
            expect(
                resolveDefaultCustomerId({ [POS_OPTION_KEYS.defaultCustomer]: null }),
            ).toBeNull();
            expect(resolveDefaultCustomerId({ [POS_OPTION_KEYS.defaultCustomer]: 0 })).toBeNull();
            expect(resolveDefaultCustomerId({ [POS_OPTION_KEYS.defaultCustomer]: -3 })).toBeNull();
            expect(
                resolveDefaultCustomerId({ [POS_OPTION_KEYS.defaultCustomer]: 'abc' }),
            ).toBeNull();
        });
    });

    describe('canAddBarcodeSilently', () => {
        const scanned = {
            product: { id: 1, selectedUnitQuantity: { id: 5, unit: { id: 2 } } },
        };

        it('adds silently when Show Quantity is off and a unit was resolved', () => {
            expect(
                canAddBarcodeSilently({ [POS_OPTION_KEYS.showQuantity]: false }, scanned),
            ).toBe(true);
            expect(canAddBarcodeSilently({}, scanned)).toBe(true);
        });

        it('prompts when Show Quantity is enabled', () => {
            expect(
                canAddBarcodeSilently({ [POS_OPTION_KEYS.showQuantity]: true }, scanned),
            ).toBe(false);
            expect(
                canAddBarcodeSilently({ [POS_OPTION_KEYS.showQuantity]: 'yes' }, scanned),
            ).toBe(false);
        });

        it('prompts when the scan did not resolve a unit quantity', () => {
            expect(canAddBarcodeSilently({}, { product: { id: 1 } })).toBe(false);
            expect(canAddBarcodeSilently({}, null)).toBe(false);
            expect(canAddBarcodeSilently({}, undefined)).toBe(false);
        });
    });
});
