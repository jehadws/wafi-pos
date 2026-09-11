/**
 * Backend form definitions — the frontend contract for `*Crud::getForm()`.
 *
 * Sources of truth (see `docs/plans/form-sync-plan-a-hybrid.md` §2):
 * - `GET /api/crud/{ns}/form-config/{id?}` → `CrudService::getFormConfig()`
 *   (`app/Services/CrudService.php:1216-1313`)
 * - Form shape: `CrudForm::form(main, tabs)` (`app/Classes/CrudForm.php`)
 * - Field factory keys: `app/Classes/CrudInput.php`
 * - Payload contract: `SbForms::getFlatForm` (`app/Traits/SbForms.php:120-172`) —
 *   submit bodies are `{ [mainFieldName]: value, [tabId]: { [fieldName]: value } }`
 *   and the backend DROPS `''`/`null` values (`0`/`'0'` survive), so an
 *   empty field can never clear a stored value on PUT.
 *
 * These types tolerate the two custom shapes that are not plain
 * `CrudForm::form()` output (RewardSystemCrud's `{main, rules, ruleForm, tabs}`
 * and ProductCrud's `{main, id, tabs}`) through index signatures — custom
 * consumers read those extra keys explicitly.
 */

/** `{label, value}[]` (`Helper::kvToJsOptions` / `toJsOptions` / `boolToOptions`). */
export interface FormOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

/** Field types emitted by `CrudInput.php` factories. */
export type FormFieldType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'date'
  | 'hidden'
  | 'textarea'
  | 'select'
  | 'search-select'
  | 'multiselect'
  | 'inline-multiselect'
  | 'select-audio'
  | 'switch'
  | 'checkbox'
  | 'media'
  | 'ckeditor'
  | 'datetimepicker'
  | 'daterangepicker'
  | 'group'
  | 'custom';

/**
 * `CrudInput::refreshConfig(url, watch, data)` — a select whose options
 * reload from `url` whenever the watched sibling field changes.
 */
export interface FormFieldRefresh {
  url: string;
  watch: string;
  data?: Record<string, unknown>;
}

/**
 * One field of a form definition. All keys are optional because the
 * backend emits heterogeneous shapes (`CrudInput::custom` only sends
 * `{label, component}`); consumers must guard before use.
 */
export interface FormFieldDef {
  name?: string;
  label?: string;
  type?: FormFieldType;
  value?: unknown;
  description?: string;
  /** Laravel rule string, e.g. `'required|min:3'` or `'required|in:a,b'`. */
  validation?: string;
  disabled?: boolean;
  options?: FormOption[];
  /** Custom component name resolved through the registry (`sbCrudForm`, …). */
  component?: string;
  /** Embedded extras (e.g. a full `FormConfig` for `sbCrudForm` targets). */
  props?: Record<string, unknown>;
  refresh?: FormFieldRefresh;
  /** Pre-seeded server errors from a previous submit. */
  errors?: unknown;
  [key: string]: unknown;
}

/** `CrudForm::tab(...)` output. */
export interface FormTabDef {
  identifier: string;
  label: string;
  fields: FormFieldDef[];
  description?: string;
  notices?: Array<Record<string, unknown>>;
  /** Custom whole-tab component (`sbProductGroup`). */
  component?: string;
  footer?: Array<Record<string, unknown>>;
}

/** `CrudForm::form(main, tabs)` output. */
export interface CrudFormDefinition {
  main: FormFieldDef | null;
  tabs: Record<string, FormTabDef>;
  [key: string]: unknown;
}

/** `GET /api/crud/{ns}/form-config/{id?}` response (`CrudService::getFormConfig`). */
export interface CrudFormConfig {
  form: CrudFormDefinition;
  labels: Record<string, string>;
  links: Record<string, string>;
  submitMethod: string;
  namespace: string;
  /**
   * Attribute used to build option labels from a created entry —
   * `CrudService::$optionAttributes`, default `{label: 'name', value: 'id'}`.
   */
  optionAttributes: string | { label?: string; value?: string };
  queryParams: Record<string, unknown>;
  title: string;
  description: string;
  src?: string;
  submitUrl?: string;
  returnUrl?: string;
}

/** JSON response of `POST /api/crud/{ns}` / `PUT /api/crud/{ns}/{id}`. */
export interface CrudSubmitResponse {
  status?: string;
  message?: string;
  redirect?: string;
  /** Created/updated model attributes (added for inline-create flows). */
  entry?: Record<string, unknown>;
}

/**
 * Represents a repeatable sub-form group (`type: 'group'`).
 * Each entry in `groups` is one existing/pre-filled row of values.
 */
export interface GroupFieldDef extends FormFieldDef {
  type: 'group';
  /** Child field definitions that each row renders. */
  fields: FormFieldDef[];
  /** Whether individual rows can be removed; defaults to `true`. */
  closable?: boolean;
  /** Pre-filled row data from the backend. */
  groups?: Array<Record<string, unknown>>;
}

/**
 * Inertia page props for a backend-driven CRUD form page.
 * Extends the raw `CrudFormConfig` with the `id` of the record being edited
 * (`undefined` on create).
 */
export interface CrudFormPageProps {
  config: CrudFormConfig;
  id?: string | number;
}

/**
 * Settings form definition structure as returned by SettingsPage::getForm().
 */
export interface SettingsFormDef {
  title?: string;
  description?: string;
  tabs?: Record<string, FormTabDef> | FormTabDef[];
  [key: string]: unknown;
}

/**
 * Inertia page props for a backend-driven Settings form page.
 */
export interface SettingsFormPageProps {
  fields?: FormFieldDef[];
  namespace?: string;
  identifier?: string;
  title?: string;
  description?: string;
  form?: SettingsFormDef;
  payload?: Record<string, unknown>;
  options?: Record<string, unknown>;
}
