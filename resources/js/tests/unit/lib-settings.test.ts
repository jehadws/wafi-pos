import { beforeEach, describe, expect, it } from 'vitest';
import Settings, { DEFAULT_SETTINGS } from '@/lib/settings';

describe('Settings singleton', () => {
  beforeEach(() => {
    // Reset the singleton's internal state so each test starts uninitialized.
    (Settings as unknown as { settings: unknown }).settings = null;
  });

  it('returns safe defaults instead of throwing before initialization', () => {
    expect(() => Settings.get()).not.toThrow();
    expect(Settings.get()).toEqual(DEFAULT_SETTINGS);
  });

  it('exposes DEFAULT_SETTINGS with usable currency defaults', () => {
    expect(DEFAULT_SETTINGS.currency.sb_currency_symbol).toBe('$');
    expect(DEFAULT_SETTINGS.currency.sb_currency_precision).toBe(2);
  });
});
