/**
 * use-settings-form.test.ts
 *
 * Unit tests for the useSettingsForm hook (Plan B §B2.2).
 *
 * Scenarios covered:
 *  1. Initial payload is exposed unchanged.
 *  2. setFieldValue updates the payload.
 *  3. null values are preserved in the payload (deletion semantics).
 *  4. save() posts to settingsApi.update and shows a success toast.
 *  5. save() shows an error toast on failure.
 *  6. isDirty reflects whether payload changed from the initial snapshot.
 *  7. isDirty resets to false after a successful save.
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useSettingsForm } from './use-settings-form';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/api', () => ({
  settingsApi: {
    update: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { settingsApi } from '@/api';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Initial payload is exposed
  // -------------------------------------------------------------------------
  it('exposes the initial payload', () => {
    const initial = { general: { tax_enabled: 'yes' } };
    const { result } = renderHook(() => useSettingsForm({ identifier: 'general', initialPayload: initial }));

    expect(result.current.payload).toEqual(initial);
  });

  // -------------------------------------------------------------------------
  // 2. setFieldValue updates the payload
  // -------------------------------------------------------------------------
  it('updates payload on setFieldValue', () => {
    const { result } = renderHook(() => useSettingsForm({ identifier: 'general', initialPayload: { name: 'old' } }));

    act(() => {
      result.current.setFieldValue('name', 'new');
    });

    expect(result.current.payload).toMatchObject({ name: 'new' });
  });

  // -------------------------------------------------------------------------
  // 3. null values are preserved
  // -------------------------------------------------------------------------
  it('preserves null values in the payload', () => {
    const { result } = renderHook(() => useSettingsForm({ identifier: 'general', initialPayload: { setting: 'value' } }));

    act(() => {
      result.current.setFieldValue('setting', null);
    });

    expect(result.current.payload.setting).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 4. save() posts and shows success toast
  // -------------------------------------------------------------------------
  it('calls settingsApi.update and shows success toast on save', async () => {
    (settingsApi.update as Mock).mockResolvedValue({ status: 'success' });

    const { result } = renderHook(() => useSettingsForm({ identifier: 'general', initialPayload: { name: 'test' } }));

    await act(async () => {
      await result.current.save();
    });

    expect(settingsApi.update).toHaveBeenCalledWith('general', { name: 'test' });
    expect(toast.success).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 5. save() shows error toast on failure
  // -------------------------------------------------------------------------
  it('shows an error toast when save fails', async () => {
    (settingsApi.update as Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSettingsForm({ identifier: 'general', initialPayload: {} }));

    await act(async () => {
      await result.current.save();
    });

    expect(toast.error).toHaveBeenCalled();
    expect(result.current.saving).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 6. isDirty reflects payload change
  // -------------------------------------------------------------------------
  it('isDirty is false initially, true after change', () => {
    const { result } = renderHook(() => useSettingsForm({ identifier: 'general', initialPayload: { x: 1 } }));

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.setFieldValue('x', 2);
    });

    expect(result.current.isDirty).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 7. isDirty resets after successful save
  // -------------------------------------------------------------------------
  it('isDirty resets to false after successful save', async () => {
    (settingsApi.update as Mock).mockResolvedValue({});

    const { result } = renderHook(() => useSettingsForm({ identifier: 'general', initialPayload: { x: 1 } }));

    act(() => {
      result.current.setFieldValue('x', 99);
    });

    expect(result.current.isDirty).toBe(true);

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.isDirty).toBe(false);
  });
});
