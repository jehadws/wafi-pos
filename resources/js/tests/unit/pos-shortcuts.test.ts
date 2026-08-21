import { describe, expect, it } from 'vitest';
import { matchesShortcut } from '@/hooks/use-pos-shortcuts';

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
