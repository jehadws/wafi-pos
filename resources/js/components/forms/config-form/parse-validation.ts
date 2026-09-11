/**
 * Client-side subset of the Laravel string rules emitted by the Crud form
 * definitions (`FormInput::validation`, e.g. `'required|min:3|max:255'`).
 *
 * This is intentionally small: it only gates obviously invalid submits
 * before the request fires. The server (`CrudPostRequest`/`CrudPutRequest`
 * → `SbForms::extractValidation`) stays authoritative — unknown rules and
 * database-backed rules (`unique`, `exists`, `Rule::in(...)` objects) are
 * ignored here on purpose. See `docs/plans/form-sync-plan-a-hybrid.md` §4.
 */

export interface ParsedValidation {
  required: boolean;
  min?: number;
  max?: number;
  email: boolean;
  numeric: boolean;
  integer: boolean;
}

const EMPTY_PARSED: ParsedValidation = {
  required: false,
  email: false,
  numeric: false,
  integer: false,
};

/**
 * Parse a rule string into the supported subset. Unknown or server-only
 * rules (`unique:table`, `exists:…`, `in:a,b`, `required_if:…`) are
 * skipped; `nullable`/`sometimes` do not make a field optional.
 */
export function parseValidation(validation?: string): ParsedValidation {
  if (!validation) {
    return { ...EMPTY_PARSED };
  }

  const parsed: ParsedValidation = { ...EMPTY_PARSED };

  for (const rawRule of validation.split('|')) {
    const rule = rawRule.trim();
    if (!rule) {
      continue;
    }

    // Parameterized conditional rules never require a value here.
    if (rule.startsWith('required_') || rule === 'present' || rule === 'nullable' || rule === 'sometimes') {
      continue;
    }

    const [name, ...params] = rule.split(':');
    const firstParam = Number(params[0]);

    switch (name) {
      case 'required':
        parsed.required = true;
        break;
      case 'min':
        if (Number.isFinite(firstParam)) {
          parsed.min = firstParam;
        }
        break;
      case 'max':
        if (Number.isFinite(firstParam)) {
          parsed.max = firstParam;
        }
        break;
      case 'email':
        parsed.email = true;
        break;
      case 'numeric':
        parsed.numeric = true;
        break;
      case 'integer':
        parsed.integer = true;
        break;
      default:
        // `unique`, `exists`, `in`, `date`, `url`, … — server's call.
        break;
    }
  }

  return parsed;
}

export interface ValidateValueParams {
  value: unknown;
  validation?: string;
  /** Label used to compose messages (already translated by the caller). */
  label?: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

/**
 * Validate a single value against the parsed subset. Returns the first
 * error message or `null` when the value passes.
 */
export function validateFieldValue({ value, validation, label, t }: ValidateValueParams): string | null {
  const rule = parseValidation(validation);
  const fieldLabel = label || t('This field');

  const isEmpty =
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0);

  if (rule.required && isEmpty) {
    return t('The :label field is required', { label: fieldLabel });
  }

  if (isEmpty) {
    return null;
  }

  if (rule.numeric || rule.integer) {
    const numeric = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isFinite(numeric)) {
      return t('The :label field must be a number', { label: fieldLabel });
    }
    if (rule.integer && !Number.isInteger(numeric)) {
      return t('The :label field must be an integer', { label: fieldLabel });
    }
    if (rule.min !== undefined && numeric < rule.min) {
      return t('The :label field must be at least :min', { label: fieldLabel, min: rule.min });
    }
    if (rule.max !== undefined && numeric > rule.max) {
      return t('The :label field may not be greater than :max', { label: fieldLabel, max: rule.max });
    }
    return null;
  }

  const text = String(value);

  if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return t('The :label field must be a valid email address', { label: fieldLabel });
  }

  if (rule.min !== undefined && text.length < rule.min) {
    return t('The :label field must be at least :min characters', { label: fieldLabel, min: rule.min });
  }

  if (rule.max !== undefined && text.length > rule.max) {
    return t('The :label field may not be greater than :max characters', { label: fieldLabel, max: rule.max });
  }

  return null;
}
