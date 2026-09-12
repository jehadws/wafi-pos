import { settingsApi } from '@/api';
import { useTranslation } from '@/lib/i18n';
import type { FormTabDef, SettingsFormDef } from '@/types/forms';
import { extractValidationErrors, getApiErrorMessage } from '@/utils/api-errors';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTabsList(tabsDef?: Record<string, FormTabDef> | FormTabDef[]): FormTabDef[] {
  if (!tabsDef) return [];
  if (Array.isArray(tabsDef)) return tabsDef;
  return Object.entries(tabsDef).map(([key, tab]) => ({
    ...tab,
    identifier: tab.identifier ?? key,
  }));
}

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
  /**
   * Pre-loaded form definition containing tabs and fields from backend.
   */
  form?: SettingsFormDef;
  /**
   * Callback invoked after successful save with submitted data.
   */
  onSaved?: (data: Record<string, unknown>) => void;
}

export interface UseSettingsFormReturn {
  /** Live payload, updates as fields change. */
  payload: Record<string, unknown>;
  /** Available options passed from the backend (read-only). */
  options: Record<string, unknown>;
  /** Active form definition if loaded. */
  form: SettingsFormDef | null;
  /** Whether the form config is being loaded asynchronously. */
  loadingForm: boolean;
  /** Error message if form loading failed. */
  formError: string | null;
  /** Validation errors per field, keyed by field name or dot-key. */
  errors: Record<string, string>;
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

export function useSettingsForm({
  identifier,
  initialPayload = {},
  initialOptions = {},
  form: initialForm,
  onSaved,
}: UseSettingsFormParams): UseSettingsFormReturn {
  const { t } = useTranslation();

  const [form, setForm] = useState<SettingsFormDef | null>(initialForm ?? null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Keep an immutable reference snapshot to compute isDirty.
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(initialPayload));
  const [payload, setPayload] = useState<Record<string, unknown>>(initialPayload);
  const [options] = useState<Record<string, unknown>>(initialOptions);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Fetch form if not provided initially and identifier is set
  useEffect(() => {
    if (initialForm) {
      setForm(initialForm);
      return;
    }
    if (typeof settingsApi?.getForm !== 'function') {
      return;
    }
    let cancelled = false;
    setLoadingForm(true);
    settingsApi
      .getForm<SettingsFormDef>(identifier)
      .then((data) => {
        if (!cancelled && data) {
          setForm(data);
          setLoadingForm(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFormError(getApiErrorMessage(err, t('Failed to load settings configuration.')));
          setLoadingForm(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [identifier, initialForm, t]);

  // ------------------------------------------------------------------
  // Field change — null values are preserved (backend deletes the key).
  // ------------------------------------------------------------------
  const setFieldValue = useCallback((key: string, value: unknown) => {
    setPayload((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const matchKey = Object.keys(current).find((k) => k === key || k.endsWith(`.${key}`));
      if (!matchKey) return current;
      const next = { ...current };
      delete next[key];
      for (const k of Object.keys(next)) {
        if (k.endsWith(`.${key}`)) {
          delete next[k];
        }
      }
      return next;
    });
  }, []);

  // ------------------------------------------------------------------
  // Save
  // ------------------------------------------------------------------
  const save = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    try {
      setErrors({});
      const tabs = getTabsList(form?.tabs);
      let dataToSend: Record<string, unknown> = payload;

      if (tabs.length > 0) {
        const nested: Record<string, unknown> = {};
        for (const tab of tabs) {
          const tabObj: Record<string, unknown> = {};
          for (const field of tab.fields ?? []) {
            if (field.name) {
              // Resolve field value in priority order:
              //  1. Flat key set by setFieldValue after user interaction.
              //  2. Dot-keyed fallback (legacy, defensive).
              //  3. Nested tab-object — the shape PHP getPayload() returns for
              //     multi-tab settings pages (e.g. GeneralSettings).
              //  4. null — signals the backend to delete the option row.
              const flatVal = payload[field.name];
              const dotKey = `${tab.identifier}.${field.name}`;
              const dotVal = payload[dotKey];
              const tabData = payload[tab.identifier];
              const nestedVal =
                tabData !== null && tabData !== undefined && typeof tabData === 'object' && !Array.isArray(tabData)
                  ? (tabData as Record<string, unknown>)[field.name]
                  : undefined;
              const val = flatVal !== undefined ? flatVal : dotVal !== undefined ? dotVal : nestedVal !== undefined ? nestedVal : null;
              tabObj[field.name] = val;
            }
          }
          nested[tab.identifier] = tabObj;
        }

        // Also carry forward any root-level keys that aren't tab fields
        for (const [k, v] of Object.entries(payload)) {
          const isTabName = tabs.some((tabItem) => tabItem.identifier === k);
          const isTabField = tabs.some((tabItem) => tabItem.fields?.some((f) => f.name === k));
          if (!isTabName && !isTabField && !k.includes('.')) {
            nested[k] = v;
          }
        }
        dataToSend = nested;
      }

      await settingsApi.update(identifier, dataToSend);
      setSavedSnapshot(JSON.stringify(payload));
      onSaved?.(dataToSend);
      toast.success(t('Settings saved'), {
        description: t('The settings were saved successfully.'),
      });
    } catch (err: unknown) {
      const serverErrors = extractValidationErrors(err);
      if (Object.keys(serverErrors).length > 0) {
        setErrors(serverErrors);
      }
      toast.error(t('Failed to save settings'), {
        description: getApiErrorMessage(err, t('An unexpected error occurred.')),
      });
    } finally {
      setSaving(false);
    }
  }, [saving, identifier, form?.tabs, payload, onSaved, t]);

  const isDirty = JSON.stringify(payload) !== savedSnapshot;

  return { payload, options, form, loadingForm, formError, errors, setFieldValue, save, saving, isDirty };
}

export default useSettingsForm;
