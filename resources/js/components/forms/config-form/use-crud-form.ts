/**
 * use-crud-form.ts
 *
 * Lifecycle hook for backend-driven full-page CRUD forms (Plan B §B2.1).
 *
 * Responsibilities:
 *  - Fetch form config from `GET /api/crud/{ns}/form-config/{id?}` when
 *    `initialConfig` is not provided.
 *  - Hydrate form values via `initialValuesFromConfig`.
 *  - Track per-field dirty state and `submitting` flag.
 *  - Client-side validation via `validateConfigForm`.
 *  - Submit via POST (create) or PUT (edit) depending on whether `id` is set.
 *  - Map 422 field errors to the `{tabId}.{fieldName}` dot-key shape expected
 *    by `ConfigForm`.
 *  - On success navigate to `res.redirect` via `router.visit` or invoke
 *    `onSubmitted` if provided.
 */

import { crudApi } from '@/api/crud';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig, CrudSubmitResponse } from '@/types/forms';
import { extractValidationErrors, getApiErrorMessage } from '@/utils/api-errors';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { initialValuesFromConfig, validateConfigForm } from './config-form';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UseCrudFormParams {
  /** CRUD namespace, e.g. `'sb.roles'`. */
  namespace: string;
  /** Record id — omit on create flows. */
  id?: string | number;
  /** Pre-fetched config (Inertia prop). When absent the hook fetches it. */
  initialConfig?: CrudFormConfig;
  /** Called on a successful submit instead of (or in addition to) redirect. */
  onSubmitted?: (res: CrudSubmitResponse) => void;
}

export interface UseCrudFormReturn {
  /** The resolved config, or `null` while loading. */
  config: CrudFormConfig | null;
  /** True while the config is being fetched. */
  loading: boolean;
  /** Error message from config fetch failure. */
  fetchError: string | undefined;
  /** Current form values keyed by `{tabId}.{fieldName}` dot keys. */
  values: Record<string, unknown>;
  /** Update a single field value and clear its error. */
  setFieldValue: (key: string, value: unknown) => void;
  /** Server + client validation errors, dot-keyed. */
  errors: Record<string, string>;
  /** Non-field error (e.g. general backend error message). */
  submitError: string | undefined;
  /** True while the form is submitting. */
  submitting: boolean;
  /** Call this from the ConfigForm `onSubmit` callback. */
  submit: (payload: Record<string, unknown>) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCrudForm({ namespace, id, initialConfig, onSubmitted }: UseCrudFormParams): UseCrudFormReturn {
  const { t } = useTranslation();

  // Abort controller for the config fetch, cancelled on unmount.
  const abortRef = useRef<AbortController | null>(null);

  const [config, setConfig] = useState<CrudFormConfig | null>(initialConfig ?? null);
  const [loading, setLoading] = useState(!initialConfig);
  const [fetchError, setFetchError] = useState<string | undefined>(undefined);

  const [values, setValues] = useState<Record<string, unknown>>(initialConfig ? initialValuesFromConfig(initialConfig) : {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  // ------------------------------------------------------------------
  // Config fetch (skipped when initialConfig is provided)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (initialConfig) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setFetchError(undefined);

    crudApi
      .formConfig(namespace, id)
      .then((fetched: CrudFormConfig) => {
        if (controller.signal.aborted) return;
        setConfig(fetched);
        setValues(initialValuesFromConfig(fetched));
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setFetchError(getApiErrorMessage(err, t('Failed to load form configuration.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, id]);

  // ------------------------------------------------------------------
  // Field change handler
  // ------------------------------------------------------------------
  const setFieldValue = useCallback((key: string, value: unknown) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  // ------------------------------------------------------------------
  // Submit handler
  // ------------------------------------------------------------------
  const submit = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!config || submitting) return;

      // Client-side validation first
      const clientErrors = validateConfigForm(config, values, t);
      if (Object.keys(clientErrors).length > 0) {
        setErrors(clientErrors);
        return;
      }

      setSubmitting(true);
      setSubmitError(undefined);
      setErrors({});

      try {
        const res: CrudSubmitResponse = id !== undefined ? await crudApi.update(namespace, id, payload) : await crudApi.create(namespace, payload);

        onSubmitted?.(res);

        if (res.redirect) {
          router.visit(res.redirect);
        }
      } catch (err: unknown) {
        const serverErrors = extractValidationErrors(err);
        const { error: generalError, ...fieldErrors } = serverErrors;

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        }

        if (generalError) {
          setSubmitError(generalError);
        } else if (Object.keys(serverErrors).length === 0) {
          setSubmitError(getApiErrorMessage(err, t('An unexpected error occurred.')));
        }
      } finally {
        setSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, submitting, values, namespace, id, onSubmitted],
  );

  return {
    config,
    loading,
    fetchError,
    values,
    setFieldValue,
    errors,
    submitError,
    submitting,
    submit,
  };
}

export default useCrudForm;
