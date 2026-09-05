import { describe, expect, it } from 'vitest';
import {
    LAST_ORDER_TYPE_STORAGE_KEY,
    pickDefaultOrderType,
    resolveDefaultCustomerId,
} from '@/services/pos-defaults';
import { POS_OPTION_KEYS } from '@/constants/pos-options';

describe('services/pos-defaults.ts', () => {
    describe('pickDefaultOrderType', () => {
        it('exports a stable storage key', () => {
            expect(LAST_ORDER_TYPE_STORAGE_KEY).toBe('sb_pos_last_order_type');
        });

        it('returns null when no types are enabled', () => {
            expect(pickDefaultOrderType([], null)).toBeNull();
            expect(pickDefaultOrderType(undefined, null)).toBeNull();
            expect(pickDefaultOrderType('takeaway', null)).toBeNull();
        });

        it('prefers the last used type while it is still enabled', () => {
            expect(pickDefaultOrderType(['takeaway', 'delivery'], 'delivery')).toBe('delivery');
            expect(pickDefaultOrderType(['delivery', 'takeaway'], 'delivery')).toBe('delivery');
        });

        it('ignores the last used type when it is no longer enabled', () => {
            expect(pickDefaultOrderType(['takeaway'], 'delivery')).toBe('takeaway');
        });

        it('uses the single enabled type regardless of what was used last', () => {
            expect(pickDefaultOrderType(['delivery'], null)).toBe('delivery');
        });

        it('prefers takeaway when several types are enabled and nothing is remembered', () => {
            expect(pickDefaultOrderType(['delivery', 'takeaway'], null)).toBe('takeaway');
        });

        it('falls back to the first enabled type when takeaway is unavailable', () => {
            expect(pickDefaultOrderType(['delivery', 'dine_in'], null)).toBe('delivery');
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
});
