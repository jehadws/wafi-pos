import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
    isEditableTarget,
    isTypingGuardedEvent,
    matchesShortcut,
    usePOSShortcuts,
} from '@/hooks/use-pos-shortcuts';

describe('matchesShortcut', () => {
    it('matches single key shortcut', () => {
        const event = new KeyboardEvent('keydown', { key: 'F4' });
        expect(matchesShortcut(event, 'f4')).toBe(true);
        expect(matchesShortcut(event, 'F4')).toBe(true);
        expect(matchesShortcut(event, 'f2')).toBe(false);
    });

    it('matches combination shortcut (Ctrl+Enter)', () => {
        const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
        expect(matchesShortcut(event, 'ctrl+enter')).toBe(true);
        expect(matchesShortcut(event, 'alt+enter')).toBe(false);
    });

    it('handles NumpadEnter when enter is configured', () => {
        const event = new KeyboardEvent('keydown', { code: 'NumpadEnter', key: 'Enter' });
        expect(matchesShortcut(event, 'enter')).toBe(true);
    });

    it('returns false for null, undefined, or empty shortcut', () => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        expect(matchesShortcut(event, null)).toBe(false);
        expect(matchesShortcut(event, undefined)).toBe(false);
        expect(matchesShortcut(event, [])).toBe(false);
    });
});

/** Dispatches a keydown on the target and returns the event (with its target). */
const fireKeydown = (target: EventTarget, init: KeyboardEventInit): KeyboardEvent => {
    let captured: KeyboardEvent | null = null;
    target.addEventListener('keydown', (e) => {
        captured = e as KeyboardEvent;
    });
    target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
    return captured as unknown as KeyboardEvent;
};

describe('isEditableTarget', () => {
    it('detects inputs, textareas and contenteditable elements', () => {
        expect(isEditableTarget(document.createElement('input'))).toBe(true);
        expect(isEditableTarget(document.createElement('textarea'))).toBe(true);
        const editable = document.createElement('div');
        editable.contentEditable = 'true';
        expect(isEditableTarget(editable)).toBe(true);
        expect(isEditableTarget(document.createElement('span'))).toBe(false);
        expect(isEditableTarget(null)).toBe(false);
    });
});

describe('isTypingGuardedEvent', () => {
    it('guards bare-key shortcuts while typing in an input', () => {
        const input = document.createElement('input');
        const event = fireKeydown(input, { key: 'p' });
        expect(isTypingGuardedEvent(event, 'p')).toBe(true);
    });

    it('allows modifier combos while typing in an input', () => {
        const input = document.createElement('input');
        const event = fireKeydown(input, { key: 'p', ctrlKey: true });
        expect(isTypingGuardedEvent(event, 'ctrl+p')).toBe(false);
    });

    it('allows function keys while typing in an input', () => {
        const input = document.createElement('input');
        const event = fireKeydown(input, { key: 'F4' });
        expect(isTypingGuardedEvent(event, 'f4')).toBe(false);
    });

    it('does not guard outside editable fields', () => {
        const div = document.createElement('div');
        const event = fireKeydown(div, { key: 'p' });
        expect(isTypingGuardedEvent(event, 'p')).toBe(false);
    });
});

describe('usePOSShortcuts', () => {
    const renderShortcuts = (options: Partial<SbPosOptions>) => {
        const handlers = {
            onPayment: vi.fn(),
            onCancel: vi.fn(),
            onShipping: vi.fn(),
            onOrderType: vi.fn(),
            onQuickSearch: vi.fn(),
            onToggleMerge: vi.fn(),
            onHold: vi.fn(),
            onNote: vi.fn(),
            onCreateCustomer: vi.fn(),
        };
        renderHook(() => usePOSShortcuts({ options, autoMerge: false, ...handlers }));
        return handlers;
    };

    it('fires a configured shortcut from the window', () => {
        const handlers = renderShortcuts({ sb_subul_keyboard_payment: ['p'] });

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));

        expect(handlers.onPayment).toHaveBeenCalledTimes(1);
    });

    it('fires the hold, note and create-customer shortcuts', () => {
        const handlers = renderShortcuts({
            sb_subul_keyboard_hold_order: ['f6'],
            sb_subul_keyboard_note: ['f7'],
            sb_subul_keyboard_create_customer: ['f8'],
        });

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F6' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F7' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8' }));

        expect(handlers.onHold).toHaveBeenCalledTimes(1);
        expect(handlers.onNote).toHaveBeenCalledTimes(1);
        expect(handlers.onCreateCustomer).toHaveBeenCalledTimes(1);
    });

    it('does not fire a bare-key shortcut while typing in an input', () => {
        const handlers = renderShortcuts({ sb_subul_keyboard_payment: ['p'] });
        const input = document.createElement('input');
        document.body.appendChild(input);

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }));

        expect(handlers.onPayment).not.toHaveBeenCalled();
        input.remove();
    });

    it('still fires modifier combos while typing in an input', () => {
        const handlers = renderShortcuts({ sb_subul_keyboard_payment: ['ctrl+p'] });
        const input = document.createElement('input');
        document.body.appendChild(input);

        input.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true }),
        );

        expect(handlers.onPayment).toHaveBeenCalledTimes(1);
        input.remove();
    });

    it('keeps the F4 payment fallback working inside inputs', () => {
        const handlers = renderShortcuts({});
        const input = document.createElement('input');
        document.body.appendChild(input);

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'F4', bubbles: true }));

        expect(handlers.onPayment).toHaveBeenCalledTimes(1);
        input.remove();
    });
});
