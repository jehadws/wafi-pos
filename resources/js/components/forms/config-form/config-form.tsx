import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig, CrudFormCustomSection, CrudFormDefinition, FormTabDef } from '@/types/forms';
import type React from 'react';
import { useMemo, useState } from 'react';
import './code-generator-field';
import { FieldRenderer } from './field-renderer';
import { validateFieldValue } from './parse-validation';
import './procurement-products-field';
import { getCustomComponent } from './registry';
import './rules-editor-field';
import './sb-crud-form';

/**
 * Modal-scoped generic renderer for a backend form definition
 * (`CrudFormConfig`) — Plan A §3/§6 of `docs/plans/form-sync-plan-a-hybrid.md`.
 *
 * Values are keyed the same way server validation errors arrive
 * (`{mainFieldName}` and `{tabId}.{fieldName}` dot keys), so 422 error
 * maps plug in without reshaping. The side-effect imports above
 * register the backend custom field components (`sbCrudForm`,
 * `sbCreateCoupons`, `procurementProducts`) so definitions can reference
 * them.
 *
 * Root-level custom sections (`CrudFormCustomSection` — a root key of
 * `form` whose value carries a `component` string, e.g. procurements'
 * `products`) render after the tabs through the same registry; the legacy
 * `rules` array (RewardSystemCrud) keeps a back-compat branch.
 */

export interface ConfigFormProps {
  config: CrudFormConfig;
  /** Keyed by main field name and `tabId.field` dot keys. */
  values: Record<string, unknown>;
  onFieldChange: (key: string, value: unknown) => void;
  /** Server errors (422 dot keys). Client-side errors are layered on top. */
  errors?: Record<string, string>;
  /** Non-field error shown as a banner (e.g. the backend `error` key). */
  submitError?: string;
  onSubmit: (payload: Record<string, unknown>) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  /** Hide the built-in footer (SbCrudForm renders its own in DialogFooter). */
  showFooter?: boolean;
  /** Stable id prefix for label htmlFor wiring. */
  idPrefix?: string;
  /** Optional id for the inner <form> (lets an external footer submit it). */
  formId?: string;
}

/**
 * Root-level custom-section recognition: a root key of `config.form`
 * (other than `main`/`tabs`) whose value is an object carrying a
 * `component` string renders through the custom-component registry
 * (`CrudFormCustomSection` — e.g. ProcurementCrud's `products`). The
 * legacy `rules` array (RewardSystemCrud) declares no component and keeps
 * its dedicated back-compat path.
 */
export function isRootCustomSection(value: unknown): value is CrudFormCustomSection {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && typeof (value as CrudFormCustomSection).component === 'string';
}

/** Root keys of a definition that render as custom sections. */
export function getRootCustomSectionKeys(form: CrudFormDefinition): string[] {
  return Object.entries(form)
    .filter(([key, value]) => key !== 'main' && key !== 'tabs' && isRootCustomSection(value))
    .map(([key]) => key);
}

/**
 * Strip client-side bookkeeping from custom-section rows before submit:
 * `_key`/`$invalid` (products rows), `_clientId` (rules rows) and phantom
 * ids (`client_*` / timestamp-sized) that must never reach a PUT.
 */
function cleanCustomSectionRows(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((row) => {
    if (!row || typeof row !== 'object') {
      return row;
    }
    const { _key, $invalid: _invalid, _clientId, ...cleanRow } = row as Record<string, unknown>;
    if (!cleanRow.id || String(cleanRow.id).startsWith('client_') || (typeof cleanRow.id === 'number' && cleanRow.id > 1000000000000)) {
      delete cleanRow.id;
    }
    return cleanRow;
  });
}

/** Build the submit body per `SbForms::getFlatForm`: `{[main]: v, [tabId]: {…}}`. */
export function buildCrudPayload(config: CrudFormConfig, values: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const { main, tabs } = config.form;

  if (main?.name) {
    payload[main.name] = values[main.name] ?? '';
  }

  for (const [tabId, tab] of Object.entries(tabs ?? {})) {
    if (!tab?.fields?.length) {
      continue;
    }
    const tabValues: Record<string, unknown> = {};
    for (const field of tab.fields) {
      if (!field.name) {
        continue;
      }
      tabValues[field.name] = values[`${tabId}.${field.name}`] ?? '';
    }
    payload[tabId] = tabValues;
  }

  // Root-level custom sections (e.g. `products` in procurements): emit the
  // section rows as-is minus client bookkeeping and phantom ids.
  const sectionKeys = getRootCustomSectionKeys(config.form);
  for (const key of sectionKeys) {
    if (values[key] !== undefined) {
      payload[key] = cleanCustomSectionRows(values[key]);
    }
  }

  // Back-compat: the legacy root `rules` array (RewardSystemCrud) predates
  // the declarative shape — it keeps the values-driven emission.
  if (values['rules'] !== undefined && !sectionKeys.includes('rules')) {
    payload['rules'] = cleanCustomSectionRows(values['rules']);
  }

  return payload;
}

/** Seed `values` from a definition's default `value`s. */
export function initialValuesFromConfig(config: CrudFormConfig): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  const { main, tabs } = config.form;

  if (main?.name) {
    values[main.name] = main.value ?? '';
  }

  for (const [tabId, tab] of Object.entries(tabs ?? {})) {
    for (const field of tab?.fields ?? []) {
      if (!field.name) {
        continue;
      }
      values[`${tabId}.${field.name}`] = field.value ?? '';
    }
  }

  // Seed root-level custom sections from their declared `value` (e.g.
  // `products` rows in procurements).
  const sectionKeys = getRootCustomSectionKeys(config.form);
  const rawForm = config.form as Record<string, unknown>;
  for (const key of sectionKeys) {
    values[key] = (rawForm[key] as CrudFormCustomSection).value ?? [];
  }

  // Back-compat: the legacy root `rules` array (RewardSystemCrud) — kv-pair
  // rows normalized into `{id, from, to, reward}` objects.
  if (!sectionKeys.includes('rules') && rawForm['rules'] !== undefined) {
    const rawRules = rawForm['rules'];
    if (Array.isArray(rawRules)) {
      values['rules'] = rawRules.map((r, index) => {
        if (Array.isArray(r)) {
          const ruleObj: Record<string, unknown> = { id: index + 1 };
          for (const item of r) {
            if (item && typeof item === 'object' && 'name' in item) {
              ruleObj[(item as { name: string; value?: unknown }).name] = (item as { value?: unknown }).value ?? '';
            }
          }
          return ruleObj;
        }
        return r;
      });
    } else {
      values['rules'] = [];
    }
  }

  return values;
}

/** Run the client-side rule subset over every field; returns dot-keyed errors. */
export function validateConfigForm(
  config: CrudFormConfig,
  values: Record<string, unknown>,
  t: (key: string, params?: Record<string, string | number>) => string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const { main, tabs } = config.form;

  if (main?.name) {
    const message = validateFieldValue({ value: values[main.name], validation: main.validation, label: main.label, t });
    if (message) {
      errors[main.name] = message;
    }
  }

  for (const [tabId, tab] of Object.entries(tabs ?? {})) {
    for (const field of tab?.fields ?? []) {
      if (!field.name) {
        continue;
      }
      const key = `${tabId}.${field.name}`;
      const message = validateFieldValue({ value: values[key], validation: field.validation, label: field.label, t });
      if (message) {
        errors[key] = message;
      }
    }
  }

  return errors;
}

function Notices({ tab }: { tab: FormTabDef }) {
  if (!Array.isArray(tab.notices) || tab.notices.length === 0) {
    return null;
  }
  return (
    <div className="mb-4 space-y-2">
      {tab.notices.map((notice, index) => {
        const text = typeof notice === 'string' ? notice : String(notice.text ?? notice.message ?? '');
        if (!text) {
          return null;
        }
        return (
          <div key={index} className="bg-muted/50 text-muted-foreground rounded-md border px-3 py-2 text-sm">
            {text}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Tab body. Hidden fields are not rendered — values are owned by the
 * parent (seeded via `initialValuesFromConfig`), so hidden inputs do not
 * need to exist in the tree for their values to submit.
 */
function TabFields({
  tab,
  values,
  onFieldChange,
  errors,
  idPrefix,
}: {
  tab: FormTabDef;
  values: Record<string, unknown>;
  onFieldChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-4">
      <Notices tab={tab} />
      {tab.fields
        .filter((field) => field.type !== 'hidden' && field.name)
        .map((field, index) => {
          const key = `${tab.identifier}.${field.name}`;
          return (
            <FieldRenderer
              key={key}
              field={field}
              value={values[key] ?? ''}
              onChange={(value) => onFieldChange(key, value)}
              error={errors?.[key]}
              id={`${idPrefix}-${tab.identifier}-${field.name}-${index}`}
              formValues={values}
            />
          );
        })}
    </div>
  );
}

export function ConfigForm({
  config,
  values,
  onFieldChange,
  errors,
  submitError,
  onSubmit,
  submitting = false,
  submitLabel,
  cancelLabel,
  onCancel,
  showFooter = true,
  idPrefix = 'config-form',
  formId,
}: ConfigFormProps) {
  const { t } = useTranslation();
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const mergedErrors = useMemo(() => ({ ...errors, ...localErrors }), [errors, localErrors]);
  const main = config.form.main;
  const tabs = useMemo(
    () =>
      Object.entries(config.form.tabs ?? {}).map(([key, tab]) => ({
        ...tab,
        identifier: tab.identifier ?? key,
      })),
    [config.form.tabs],
  );
  const mainName = main?.name;

  /**
   * Root-level custom sections to render after the tabs: declared
   * `CrudFormCustomSection`s plus the legacy `rules` back-compat branch.
   * Everything but `component`/`value`/`label` rides `field.props`.
   */
  const rootCustomSections = useMemo(() => {
    const rawForm = config.form as Record<string, unknown>;
    const sections = getRootCustomSectionKeys(config.form).map((key) => {
      const { component, value: _value, label, ...props } = rawForm[key] as CrudFormCustomSection;
      return { key, component, label: label as string | undefined, props };
    });
    // Back-compat: the legacy `rules` array (RewardSystemCrud) predates the
    // declarative shape — map it to the registered 'rules' component.
    if (rawForm['rules'] !== undefined && !sections.some((section) => section.key === 'rules')) {
      sections.push({ key: 'rules', component: 'rules', label: undefined, props: {} });
    }
    return sections;
  }, [config.form]);

  const clearLocalError = (key: string) => {
    setLocalErrors((current) => {
      if (!(key in current)) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const clientErrors = validateConfigForm(config, values, t);
    setLocalErrors(clientErrors);

    if (Object.keys(clientErrors).length > 0) {
      return;
    }

    void onSubmit(buildCrudPayload(config, values));
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
      {submitError && (
        <div role="alert" className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {submitError}
        </div>
      )}

      {mainName && main && (
        <FieldRenderer
          field={main}
          value={values[mainName] ?? ''}
          onChange={(value) => {
            clearLocalError(mainName);
            onFieldChange(mainName, value);
          }}
          error={mergedErrors[mainName]}
          id={`${idPrefix}-main-${mainName}`}
        />
      )}

      {tabs.length > 0 && (
        <Tabs defaultValue={tabs[0]?.identifier} className="w-full">
          <TabsList className="flex w-full">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.identifier} value={tab.identifier} className="flex-1">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.identifier} value={tab.identifier} className="mt-4">
              <TabFields
                tab={tab}
                values={values}
                onFieldChange={(key, value) => {
                  clearLocalError(key);
                  onFieldChange(key, value);
                }}
                errors={mergedErrors}
                idPrefix={idPrefix}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Root-level custom sections (e.g. rewards rules, procurement products) */}
      {rootCustomSections.map(({ key, component, label, props }) => {
        const Custom = getCustomComponent(component);
        if (!Custom) {
          if (import.meta.env.DEV) {
            console.warn(`[ConfigForm] No custom component registered for "${component}" (root section "${key}") — section hidden.`);
          }
          return null;
        }
        return (
          <div key={key} className="mt-6 border-t pt-4">
            <Custom
              field={{ name: key, label: label ?? config.labels?.[key] ?? t(key), type: 'custom', props }}
              value={values[key] ?? []}
              onChange={(next) => onFieldChange(key, next)}
              error={mergedErrors[key]}
            />
          </div>
        );
      })}

      {showFooter && (
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              {cancelLabel ?? t('Cancel')}
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitLabel ?? t('Save')}
          </Button>
        </div>
      )}
    </form>
  );
}

export default ConfigForm;
