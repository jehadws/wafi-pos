/**
 * settings-form-page.tsx
 *
 * Generic full-page shell for backend-driven settings forms (Plan B §B2.4).
 *
 * Renders:
 *  - An `AppLayout` wrapper with breadcrumbs.
 *  - A page `<Head>` title.
 *  - A card-style panel with title, description, and a scrollable field area.
 *  - A sticky bottom footer with "Save Settings" button and dirty indicator.
 *  - An optional `customSections` slot for complex custom cards that need
 *    to appear alongside or after the standard field rows.
 *  - Wired to `useSettingsForm` for state management.
 *
 * Field layout:
 *  - Fields are rendered as a 2-column responsive grid using `FieldRenderer`.
 *  - For fields that need full width, pass `{ fullWidth: true }` in the
 *    field def (checked via the `[key]` index signature).
 */

import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import type { BreadcrumbItem } from '@/types';
import type { FormFieldDef } from '@/types/forms';
import { Head } from '@inertiajs/react';
import { Loader2, Save } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../../ui/button';
import { FieldRenderer } from './field-renderer';
import { useSettingsForm } from './use-settings-form';

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

  /** Field definitions — rendered in a 2-column grid. */
  fields: FormFieldDef[];

  // -- Layout --
  /** Page `<title>` tag and card header title. */
  title: string;
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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsFormPage({
  identifier,
  initialPayload,
  initialOptions,
  fields,
  title,
  description,
  breadcrumbs,
  customSections,
}: SettingsFormPageProps) {
  const { t } = useTranslation();

  const { payload, setFieldValue, save, saving, isDirty } = useSettingsForm({
    identifier,
    initialPayload,
    initialOptions,
  });

  // Build a flat values map for FieldRenderer: `{fieldName: value}`.
  const values: Record<string, unknown> = payload;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={title} />

      <div className="p-6">
        <div className="space-y-6">
          {/* ── Main settings card ── */}
          <div className="relative overflow-hidden rounded-xl border">
            {/* Card header */}
            <div className="relative p-6 md:p-8">
              <h1 className="text-2xl font-semibold">{title}</h1>
              {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}

              {/* Field grid */}
              {fields.length > 0 && (
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {fields
                    .filter((field) => field.name && field.type !== 'hidden')
                    .map((field, index) => {
                      const key = field.name as string;
                      const isFullWidth = Boolean(field['fullWidth']);
                      return (
                        <div key={key} className={isFullWidth ? 'md:col-span-2' : ''}>
                          <FieldRenderer
                            field={field}
                            value={values[key] ?? ''}
                            onChange={(value) => setFieldValue(key, value)}
                            id={`settings-${identifier}-${key}-${index}`}
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* ── Custom sections slot ── */}
            {customSections && <div className="px-6 pb-6 md:px-8">{customSections}</div>}

            {/* ── Sticky footer ── */}
            <div className="mt-6 flex items-center justify-between rounded-b-xl border-t p-3">
              {isDirty ? <p className="text-muted-foreground text-xs">{t('You have unsaved changes.')}</p> : <span />}
              <Button type="button" onClick={() => void save()} disabled={saving} id={`settings-${identifier}-save-btn`}>
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
