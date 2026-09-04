import type { AxiosError } from 'axios';

/**
 * Extract Laravel validation errors from an axios error response.
 *
 * Inertia's `form.post/put` flattens the backend `errors` object
 * (`{ key: string[] }`) into `{ key: string }` before handing it to
 * `onError`. Pages that submit through the `/api` resource clients
 * (raw axios) call this helper to get the same flat shape, so the
 * existing `onError` handlers keep working unchanged.
 */
export function extractValidationErrors(error: unknown): Record<string, string> {
    const flat: Record<string, string> = {};

    const axiosError = error as AxiosError<{ errors?: Record<string, string | string[]>; error?: string } | undefined>;
    const rawErrors = axiosError?.response?.data?.errors;

    if (rawErrors && typeof rawErrors === 'object') {
        for (const key in rawErrors) {
            const value = rawErrors[key];
            flat[key] = Array.isArray(value) ? String(value[0]) : String(value);
        }
    }

    // General (non-field) errors — some handlers check `errors.error`.
    const generalError = axiosError?.response?.data?.error;
    if (typeof generalError === 'string' && generalError) {
        flat.error = generalError;
    }

    return flat;
}

/**
 * Human-readable message from an API error response.
 *
 * The backend error envelope is `{ success/status, data, message }`;
 * `message` carries the useful reason (e.g. "Unable to delete X as it's
 * a dependency for Y"). Falls back to the provided default for network
 * failures or unexpected shapes.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
    const axiosError = error as AxiosError<{ message?: string } | undefined>;
    const message = axiosError?.response?.data?.message;

    if (typeof message === 'string' && message) {
        return message;
    }

    return fallback;
}
