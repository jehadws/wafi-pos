/**
 * settings-form-page.tsx
 *
 * Generic full-page shell for backend-driven settings forms (Plan B §B2.4).
 *
 * Renders:
 *  - An `AppLayout` wrapper with breadcrumbs.
 *  - A page `<Head>` title.
 *  - A card-style panel with title, description, and tab navigation.
 *  - Tab content rendered as a 2-column responsive grid using `FieldRenderer`.
 *  - A sticky bottom footer with "Save Settings" button, dirty indicator, and optional custom actions.
 *  - An optional `customSections` slot for complex custom cards that need
 *    to appear alongside or after the standard field rows.
 *  - Wired to `useSettingsForm` for state management.
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import type { BreadcrumbItem } from '@/types';
import type { FormFieldDef, FormOption, FormTabDef, SettingsFormDef } from '@/types/forms';
import { Head } from '@inertiajs/react';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../ui/button';
import { FieldRenderer } from './field-renderer';
import { useSettingsForm } from './use-settings-form';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTabsList(tabsDef?: Record<string, FormTabDef> | FormTabDef[]): FormTabDef[] {
  if (!tabsDef) return [];
  if (Array.isArray(tabsDef)) return tabsDef;
  // Object.entries preserves the PHP array key so we can inject it as `identifier`
  // when the tab definition doesn't already carry one (e.g. POS settings uses raw
  // associative arrays without a CrudForm::tab() wrapper).
  return Object.entries(tabsDef).map(([key, tab]) => ({
    ...tab,
    identifier: tab.identifier ?? key,
  }));
}

// ---------------------------------------------------------------------------
// Public props
// ---------------------------------------------------------------------------

export interface SettingsFormPageProps {
  /** Settings section identifier, e.g. `'general'`. */
  identifier: string;
  /** Current persisted values from Inertia page props. */
  initialPayload?: Record<string, unknown>;
  /** Available option lists from Inertia page props. */
  initialOptions?: Record<string, unknown>;

  /** Full form definition containing tabs and fields from backend. */
  form?: SettingsFormDef;
  /** Flat field definitions — fallback if not using tabs. */
  fields?: FormFieldDef[];

  // -- Layout --
  /** Page `<title>` tag and card header title. */
  title?: string;
  /** Subtitle shown beneath the title. */
  description?: string;
  /** Breadcrumb trail for `AppLayout`. */
  breadcrumbs?: BreadcrumbItem[];

  // -- Slots --
  /**
   * Custom sections injected below the standard field grid.
   * Use for complex cards that cannot be expressed as simple field defs.
   */
  customSections?: ReactNode;

  /** Extra buttons injected into footer (e.g. "Reset Default"). */
  footerActions?: ReactNode;

  /** Callback after successful save with submitted payload. */
  onSaved?: (payload: Record<string, unknown>) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsFormPage({
  identifier,
  initialPayload,
  initialOptions,
  form: initialForm,
  fields,
  title: propTitle,
  description: propDescription,
  breadcrumbs,
  customSections,
  footerActions,
  onSaved,
}: SettingsFormPageProps) {
  const { t } = useTranslation();

  const { payload, options, form, loadingForm, formError, setFieldValue, save, saving, isDirty } = useSettingsForm({
    identifier,
    initialPayload,
    initialOptions,
    form: initialForm,
    onSaved,
  });

  const tabs = useMemo(() => {
    if (fields && fields.length > 0) {
      return [{ identifier: 'general', label: t('General'), fields }];
    }
    return getTabsList(form?.tabs);
  }, [fields, form?.tabs, t]);

  const [activeTab, setActiveTab] = useState<string>(() => tabs[0]?.identifier ?? 'general');

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((item) => item.identifier === activeTab)) {
      setActiveTab(tabs[0].identifier);
    }
  }, [tabs, activeTab]);

  const activeTabDef = tabs.find((item) => item.identifier === activeTab) ?? tabs[0];

  const pageTitle = propTitle ?? form?.title ?? t('Settings');
  const pageDescription = propDescription ?? form?.description;

  const getFieldValue = (key: string, tabId: string): unknown => {
    if (key in payload) {
      return payload[key];
    }
    if (tabId in payload && payload[tabId] && typeof payload[tabId] === 'object') {
      return (payload[tabId] as Record<string, unknown>)[key] ?? '';
    }
    return '';
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={pageTitle} />

      <div className="p-6">
        <div className="space-y-6">
          {/* ── Main settings card ── */}
          <div className="relative overflow-hidden rounded-xl border">
            {/* Card header */}
            <div className="relative p-6 md:p-8">
              <h1 className="text-2xl font-semibold">{pageTitle}</h1>
              {pageDescription && <p className="text-muted-foreground mt-1 text-sm">{pageDescription}</p>}

              {/* Loading state */}
              {loadingForm && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </div>
              )}

              {/* Error state */}
              {formError && !loadingForm && (
                <div className="bg-destructive/10 text-destructive mt-6 flex items-center gap-3 rounded-lg p-4 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Tab navigation */}
              {!loadingForm && tabs.length > 1 && (
                <div className="mt-6 border-b pb-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="flex w-full flex-wrap justify-start">
                      {tabs.map((tab) => (
                        <TabsTrigger key={tab.identifier} value={tab.identifier}>
                          {t(tab.label)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              )}

              {/* Active Tab fields grid */}
              {!loadingForm && activeTabDef && (
                <div className="mt-6">
                  {activeTabDef.description && <p className="text-muted-foreground mb-4 text-sm">{t(activeTabDef.description)}</p>}
                  <div className="grid gap-6 md:grid-cols-2">
                    {(activeTabDef.fields ?? [])
                      .filter((field) => field.name && field.type !== 'hidden')
                      .map((field, index) => {
                        const key = field.name as string;
                        const isFullWidth = Boolean(field['fullWidth']) || field.type === 'textarea';
                        const mergedOptions =
                          field.options ?? (options?.[key] as FormOption[] | undefined) ?? (initialOptions?.[key] as FormOption[] | undefined);
                        const fieldMerged: FormFieldDef = {
                          ...field,
                          options: mergedOptions,
                        };

                        return (
                          <div key={key} className={isFullWidth ? 'md:col-span-2' : ''}>
                            <FieldRenderer
                              field={fieldMerged}
                              value={getFieldValue(key, activeTabDef.identifier)}
                              onChange={(value) => setFieldValue(key, value)}
                              id={`settings-${identifier}-${activeTabDef.identifier}-${key}-${index}`}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Custom sections slot ── */}
            {customSections && <div className="px-6 pb-6 md:px-8">{customSections}</div>}

            {/* ── Sticky footer ── */}
            <div className="mt-6 flex items-center justify-between rounded-b-xl border-t p-3">
              <div className="flex items-center gap-3">
                {footerActions}
                {isDirty && <p className="text-muted-foreground text-xs">{t('You have unsaved changes.')}</p>}
              </div>
              <Button type="button" onClick={() => void save()} disabled={saving || loadingForm} id={`settings-${identifier}-save-btn`}>
                {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                {t('Save Settings')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default SettingsFormPage;
