import type { FormFieldDef } from '@/types/forms';
import type { ComponentType } from 'react';

/**
 * Registry for backend-declared custom field components
 * (`FormInput::custom(label, component)` and
 * `FormInput::searchSelect(component: 'sbCrudForm', props: …)`).
 *
 * Components self-register at module scope (see `sb-crud-form.tsx`) so
 * the renderer never imports them statically — that would create an
 * import cycle (renderer → registry → component → renderer). A name
 * that is referenced by the backend but never registered resolves to
 * `null` and the renderer logs a dev warning instead of crashing.
 */

/**
 * Props every custom field component receives from the renderer.
 * `value`/`onChange` are untyped because custom components cover
 * heterogeneous shapes (plain selects, row editors, whole-tab editors).
 */
export interface CustomFieldComponentProps {
  field: FormFieldDef;
  value: unknown;
  /**
   * `createdEntry` is the raw created entry — `sbCrudForm` hands it to
   * the parent so callers can keep richer state (e.g. the accounts page
   * needs `name` + `id` for its manual list).
   */
  onChange: (value: unknown, createdEntry?: Record<string, unknown>) => void;
  error?: string;
  disabled?: boolean;
  /** Stable id for label htmlFor wiring. */
  id?: string;
}

export type CustomFieldComponent = ComponentType<CustomFieldComponentProps>;

const components = new Map<string, CustomFieldComponent>();

/** Register a component under its backend name (idempotent, last wins). */
export function registerCustomComponent(name: string, component: CustomFieldComponent): void {
  components.set(name, component);
}

/** Resolve a backend component name; `null` when unregistered. */
export function getCustomComponent(name?: string): CustomFieldComponent | null {
  if (!name) {
    return null;
  }
  return components.get(name) ?? null;
}

/** Test helper — drop every registration. */
export function clearCustomComponents(): void {
  components.clear();
}
