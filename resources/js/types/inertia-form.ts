import type { InertiaFormProps, SetDataByKeyValuePair } from '@inertiajs/react';

/**
 * The dotted-path key grammar Inertia accepts for form fields
 * (`units_selling_group.0.unit_id`, `rules.0.from`), derived from the
 * `SetDataByKeyValuePair` setter so form code can index `form.errors` and
 * call `setError`/`clearErrors` with those paths without dropping type
 * checking (and without `@ts-expect-error` / `as any`).
 */
export type AppFormDataKeys<T extends object> = Parameters<SetDataByKeyValuePair<T>>[0];

/** The `useForm<T>()` return shape shared by the dashboard forms. */
export type AppForm<T extends object> = InertiaFormProps<T>;
