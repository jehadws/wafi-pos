/**
 * use-settings-form.ts
 *
 * Lifecycle hook for backend-driven Settings form pages (Plan B §B2.2).
 *
 * Responsibilities:
 *  - Accept the initial payload from Inertia props or an API response.
 *  - Expose `payload`, `setFieldValue(key, value)`, `save()`, `saving`.
 *  - Preserve `null` values in the payload so the backend deletes the option.
 *  - Post to `POST /api/settings/{identifier}` via `settingsApi.update`.
 *  - Dispatch success / error toasts via `sonner`.
 */

import { settingsApi } from '@/api';
import { useTranslation } from '@/lib/i18n';
import { getApiErrorMessage } from '@/utils/api-errors';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseSettingsFormParams {
  /**
   * Settings section identifier — maps to the Laravel settings store key
   * and to `POST /api/settings/{identifier}`.
   */
  identifier: string;
  /**
   * Current persisted values, e.g. from an Inertia page prop.
   * `null` values are intentional — they signal "delete this option".
   */
  initialPayload?: Record<string, unknown>;
  /**
   * Extra context (available options lists, etc.) passed from the backend.
   * Stored as-is; consumers can read it from the return value.
   */
  initialOptions?: Record<string, unknown>;
}

export interface UseSettingsFormReturn {
  /** Live payload, updates as fields change. */
  payload: Record<string, unknown>;
  /** Available options passed from the backend (read-only). */
  options: Record<string, unknown>;
  /** Update one key in the payload. Pass `null` to mark for deletion. */
  setFieldValue: (key: string, value: unknown) => void;
  /** Persist the current payload to the backend. */
  save: () => Promise<void>;
  /** True while the save request is in-flight. */
  saving: boolean;
  /** True when the payload has changed from the last persisted snapshot. */
  isDirty: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSettingsForm({ identifier, initialPayload = {}, initialOptions = {} }: UseSettingsFormParams): UseSettingsFormReturn {
  const { t } = useTranslation();

  // Keep an immutable reference snapshot to compute isDirty.
  // Must be state (not ref) so that updating it after save triggers a re-render.
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(initialPayload));

  const [payload, setPayload] = useState<Record<string, unknown>>(initialPayload);
  const [options] = useState<Record<string, unknown>>(initialOptions);
  const [saving, setSaving] = useState(false);

  // ------------------------------------------------------------------
  // Field change — null values are preserved (backend deletes the key).
  // ------------------------------------------------------------------
  const setFieldValue = useCallback((key: string, value: unknown) => {
    setPayload((current) => ({ ...current, [key]: value }));
  }, []);

  // ------------------------------------------------------------------
  // Save
  // ------------------------------------------------------------------
  const save = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    try {
      // settingsApi.update expects SettingsSection — cast to `any` here
      // because settings-form pages can target arbitrary section strings
      // beyond the typed union; the backend routes them correctly.
      await settingsApi.update(identifier as Parameters<typeof settingsApi.update>[0], payload);
      setSavedSnapshot(JSON.stringify(payload));
      toast.success(t('Settings saved'), {
        description: t('The settings were saved successfully.'),
      });
    } catch (err: unknown) {
      toast.error(t('Failed to save settings'), {
        description: getApiErrorMessage(err, t('An unexpected error occurred.')),
      });
    } finally {
      setSaving(false);
    }
  }, [saving, identifier, payload, t]);

  const isDirty = JSON.stringify(payload) !== savedSnapshot;

  return { payload, options, setFieldValue, save, saving, isDirty };
}

export default useSettingsForm;
