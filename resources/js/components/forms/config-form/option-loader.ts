/**
 * option-loader.ts
 *
 * Resolves FormOption[] for a given field, supporting three modes:
 *
 * 1. Static   -- field.options is already a populated array; return it.
 * 2. Dynamic  -- field.refresh.url is set without a watch peer; fetch
 *    immediately from the URL.
 * 3. Sibling watcher -- field.refresh.watch is set; re-fetch from
 *    field.refresh.url whenever formValues[field.refresh.watch] changes.
 *
 * Backend source of truth: CrudInput::refreshConfig (app/Classes/CrudInput.php).
 */

import type { FormFieldDef, FormOption } from '@/types/forms';

type RemoteOption = { label: string; value: string | number | boolean; disabled?: boolean };

async function fetchOptions(url: string, data?: Record<string, unknown>): Promise<FormOption[]> {
  const base = url.startsWith('/') ? window.location.origin + url : url;
  const target = new URL(base);

  if (data) {
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && val !== null) {
        target.searchParams.set(key, String(val));
      }
    }
  }

  const response = await fetch(target.toString(), {
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error('[option-loader] fetch failed: ' + response.status + ' ' + response.statusText);
  }

  const json: unknown = await response.json();
  const items: RemoteOption[] = Array.isArray(json) ? json : [];
  return items.map((item) => ({
    label: item.label,
    value: item.value,
    ...(item.disabled !== undefined ? { disabled: item.disabled } : {}),
  }));
}

/**
 * Resolve the options for a field.
 *
 * @param field       The field definition from the backend.
 * @param formValues  The current form value map (used when refresh.watch is
 *                    set; the callee extracts the watched sibling value and
 *                    appends it to the request).
 */
export async function loadFieldOptions(field: FormFieldDef, formValues: Record<string, unknown>): Promise<FormOption[]> {
  // 1. Static options.
  if (Array.isArray(field.options) && field.options.length > 0) {
    return field.options;
  }

  // 2 & 3. Dynamic (with or without sibling watcher).
  if (field.refresh?.url) {
    const extraData = { ...(field.refresh.data ?? {}) };

    if (field.refresh.watch) {
      const watchedValue =
        formValues[field.refresh.watch] ??
        Object.entries(formValues).find(([k]) => k.endsWith(`.${field.refresh!.watch}`))?.[1];
      if (watchedValue !== undefined && watchedValue !== null && watchedValue !== '') {
        extraData[field.refresh.watch] = watchedValue;
        extraData['identifier'] = watchedValue;
      }
    }

    try {
      return await fetchOptions(field.refresh.url, extraData);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[option-loader] Failed to load dynamic options:', err);
      }
      return [];
    }
  }

  return [];
}
