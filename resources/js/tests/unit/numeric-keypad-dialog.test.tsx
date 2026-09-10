/**
 * tests/unit/numeric-keypad-dialog.test.tsx
 *
 * The "Numpad" POS setting (sb_subul_numpad) swaps the keypad layout:
 * 'default' keeps the original layout; 'advanced' ports NexoPOS
 * ns-numpad-plus — an explicit "." key next to 0, backspace in the bottom
 * row and a full-width Enter.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NumericKeypadDialog } from '@/components/ui/numeric-keypad-dialog';
import { POS_OPTION_KEYS, resolveNumpadVariant } from '@/constants/pos-options';

vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({ t: (s: string) => s }),
}));

const renderKeypad = (props: Record<string, unknown> = {}) =>
    render(
        <NumericKeypadDialog
            open={true}
            onOpenChange={vi.fn()}
            onConfirm={vi.fn()}
            title="Item Price"
            {...props}
        />,
    );

describe('constants/pos-options resolveNumpadVariant', () => {
    it('resolves the numpad variant from the POS options', () => {
        expect(resolveNumpadVariant({})).toBe('default');
        expect(resolveNumpadVariant({ [POS_OPTION_KEYS.numpad]: 'default' })).toBe('default');
        expect(resolveNumpadVariant({ [POS_OPTION_KEYS.numpad]: 'advanced' })).toBe('advanced');
        expect(resolveNumpadVariant({ [POS_OPTION_KEYS.numpad]: 'garbage' })).toBe('default');
    });
});

describe('components/ui/numeric-keypad-dialog advanced variant', () => {
    it('types decimals with the explicit "." key and confirms with the full-width Enter', () => {
        const onConfirm = vi.fn();
        renderKeypad({ variant: 'advanced', allowDecimal: true, onConfirm });

        // Advanced layout (ns-numpad-plus): "." sits next to 0, Enter is a
        // full-width row.
        expect(screen.getByRole('button', { name: '.' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: '1' }));
        fireEvent.click(screen.getByRole('button', { name: '.' }));
        fireEvent.click(screen.getByRole('button', { name: '5' }));
        // The dialog renders in a radix portal — query document.body, not the
        // component container.
        expect(document.body.textContent).toContain('1.5');

        fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
        expect(onConfirm).toHaveBeenCalledWith('1.5');
    });

    it('keeps the "." key inert when decimals are not allowed', () => {
        const onConfirm = vi.fn();
        renderKeypad({ variant: 'advanced', allowDecimal: false, onConfirm });

        fireEvent.click(screen.getByRole('button', { name: '1' }));
        fireEvent.click(screen.getByRole('button', { name: '.' }));
        fireEvent.click(screen.getByRole('button', { name: '2' }));
        expect(document.body.textContent).toContain('12');

        fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
        expect(onConfirm).toHaveBeenCalledWith('12');
    });

    it('keeps the default layout unchanged (decimal row only when allowed)', () => {
        renderKeypad({ allowDecimal: false });

        expect(screen.queryByRole('button', { name: '.' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    });

    it('shows the decimal row in the default layout when decimals are allowed', () => {
        renderKeypad({ allowDecimal: true });

        expect(screen.getByRole('button', { name: '.' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy();
    });
});
