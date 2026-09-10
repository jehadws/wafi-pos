import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POS_OPTION_KEYS, resolveUnitDisplayPrice } from '@/constants/pos-options';

describe('constants/pos-options resolveUnitDisplayPrice', () => {
    // Mirrors the real payload from TaxService::computeTax for an exclusive
    // product with a 16% tax group: edit = 86.45, with-tax = 100.282.
    const unit = {
        sale_price_edit: 86.45,
        sale_price_without_tax: 86.45,
        sale_price_with_tax: 100.282,
    };

    it('returns 0 for a missing unit', () => {
        expect(resolveUnitDisplayPrice(undefined, {})).toBe(0);
        expect(resolveUnitDisplayPrice(null, {})).toBe(0);
    });

    it('returns the edit price when VAT is disabled — either display setting', () => {
        expect(
            resolveUnitDisplayPrice(unit, { sb_subul_vat: 'disabled', sb_subul_price_with_tax: 'yes' }),
        ).toBe(86.45);
        expect(
            resolveUnitDisplayPrice(unit, { sb_subul_vat: 'disabled', sb_subul_price_with_tax: 'no' }),
        ).toBe(86.45);
    });

    it('falls back to the without-tax price when the edit price is missing and VAT is disabled', () => {
        expect(
            resolveUnitDisplayPrice(
                { sale_price_without_tax: 50, sale_price_with_tax: 58 },
                { sb_subul_vat: 'disabled' },
            ),
        ).toBe(50);
    });

    it('returns the with-tax price when display is yes and VAT is enabled', () => {
        expect(
            resolveUnitDisplayPrice(unit, { sb_subul_vat: 'products_vat', sb_subul_price_with_tax: 'yes' }),
        ).toBe(100.282);
    });

    it('returns the without-tax price when display is no and VAT is enabled', () => {
        expect(
            resolveUnitDisplayPrice(unit, { sb_subul_vat: 'flat_vat', sb_subul_price_with_tax: 'no' }),
        ).toBe(86.45);
    });

    it('returns 0 when the resolved field is absent (legacy payloads with only sale_price)', () => {
        expect(
            resolveUnitDisplayPrice({ sale_price: 10 } as any, {
                sb_subul_vat: 'products_vat',
                sb_subul_price_with_tax: 'no',
            }),
        ).toBe(0);
    });
});

describe('POS_OPTION_KEYS registry', () => {
    it('has no duplicate values (aliases would silently mask each other)', () => {
        const values = Object.values(POS_OPTION_KEYS);
        expect(new Set(values).size).toBe(values.length);
    });

    it('every key is a backend sb_ option string', () => {
        for (const value of Object.values(POS_OPTION_KEYS)) {
            expect(value).toMatch(/^sb_(subul|orders|customers)_/);
        }
    });

    it('covers the keyboard shortcut keys defined in app/Settings/pos/shortcuts.php', () => {
        for (const key of [
            POS_OPTION_KEYS.keyboardPayment,
            POS_OPTION_KEYS.keyboardCancelOrder,
            POS_OPTION_KEYS.keyboardShipping,
            POS_OPTION_KEYS.keyboardOrderType,
            POS_OPTION_KEYS.keyboardQuickSearch,
            POS_OPTION_KEYS.keyboardToggleMerge,
            POS_OPTION_KEYS.keyboardHoldOrder,
            POS_OPTION_KEYS.keyboardNote,
            POS_OPTION_KEYS.keyboardCreateCustomer,
            POS_OPTION_KEYS.keyboardFullscreen,
        ]) {
            expect(key).toMatch(/^sb_subul_keyboard_/);
        }
    });
});

describe('POS_OPTION_KEYS registry integrity', () => {
    // Runtime source roots scanned for POS_OPTION_KEYS.<key> consumers.
    const RUNTIME_DIRS = ['components', 'hooks', 'services', 'pages', 'utils', 'lib', 'api', 'constants'];

    // Keys with no frontend runtime consumer by design:
    // - hideEmptyCategories / hideExhaustedProducts are enforced backend-side
    //   (CategoryController::applyHideProducts / applyHideCategories).
    // - registerChangePaymentType is enforced backend-side
    //   (CashRegistersService::saveOrderChange).
    // - keyboardShortcuts (sb_subul_keyboard_shortcuts) is the MultiKeySelector
    //   choices list for the settings UI, not a runtime option.
    const BACKEND_ENFORCED_OR_SETTINGS_ONLY = new Set([
        'hideEmptyCategories',
        'hideExhaustedProducts',
        'registerChangePaymentType',
        'keyboardShortcuts',
    ]);

    function collectSourceFiles(dir: string): string[] {
        const files: string[] = [];
        for (const name of readdirSync(dir)) {
            const full = join(dir, name);
            if (statSync(full).isDirectory()) {
                files.push(...collectSourceFiles(full));
            } else if (/\.(ts|tsx)$/.test(name)) {
                files.push(full);
            }
        }
        return files;
    }

    it('has no dead keys — every registered key is read by runtime code', () => {
        const used = new Set<string>();
        for (const dir of RUNTIME_DIRS) {
            const root = resolve(process.cwd(), 'resources/js', dir);
            for (const file of collectSourceFiles(root)) {
                const source = readFileSync(file, 'utf-8');
                for (const match of source.matchAll(/POS_OPTION_KEYS\.(\w+)/g)) {
                    used.add(match[1]);
                }
            }
        }

        // A key that is registered but consumed nowhere silently ignores its
        // setting (the "Editable Unit Price" bug). Fail loudly and list them.
        const dead = Object.keys(POS_OPTION_KEYS).filter(
            (key) => !used.has(key) && !BACKEND_ENFORCED_OR_SETTINGS_ONLY.has(key),
        );
        expect(dead).toEqual([]);
    });
});
