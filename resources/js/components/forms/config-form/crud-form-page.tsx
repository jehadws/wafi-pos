/**
 * crud-form-page.tsx
 *
 * Generic full-page shell for backend-driven CRUD create / edit flows
 * (Plan B §B2.3).
 *
 * Renders:
 *  - An `AppLayout` wrapper with breadcrumbs.
 *  - A page `<Head>` title via Inertia.
 *  - A sticky top header (title, description, back button, save button)
 *    matching the existing `FormHeader` visual pattern.
 *  - An optional `topNotice` slot for banners / warnings above the form.
 *  - An optional `actionButtons` slot to inject extra buttons in the header.
 *  - A `ConfigForm` wired to `useCrudForm`.
 *  - A loading skeleton while the config is being fetched.
 *  - An error state when config fetch fails.
 */

import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import type { BreadcrumbItem } from '@/types';
import type { CrudFormConfig, CrudSubmitResponse } from '@/types/forms';
import { Head } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../../ui/button';
import { ConfigForm } from './config-form';
import { useCrudForm } from './use-crud-form';

// ---------------------------------------------------------------------------
// Public props
// ---------------------------------------------------------------------------

export interface CrudFormPageProps {
  /** CRUD namespace, e.g. `'sb.roles'`. */
  namespace: string;
  /** Record id — omit on create flows. */
  id?: string | number;
  /** Pre-fetched config (pass from Inertia page props to skip the fetch). */
  initialConfig?: CrudFormConfig;
  /** Called on successful submit (in addition to / instead of redirect). */
  onSubmitted?: (res: CrudSubmitResponse) => void;

  // -- Layout --
  /** Page `<title>` tag and header title. */
  title: string;
  /** Subtitle beneath the title. */
  description?: string;
  /** Breadcrumb trail for `AppLayout`. */
  breadcrumbs?: BreadcrumbItem[];
  /** Called when the back / cancel button is pressed. Defaults to `history.back()`. */
  onCancel?: () => void;

  // -- Slots --
  /** Optional banner/notice rendered above the form (e.g. a warning card). */
  topNotice?: ReactNode;
  /** Extra buttons injected into the page header action area. */
  actionButtons?: ReactNode;

  // -- Form labels --
  submitLabel?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CrudFormPage({
  namespace,
  id,
  initialConfig,
  onSubmitted,
  title,
  description,
  breadcrumbs,
  onCancel,
  topNotice,
  actionButtons,
  submitLabel,
}: CrudFormPageProps) {
  const { t } = useTranslation();

  const { config, loading, fetchError, values, setFieldValue, errors, submitError, submitting, submit } = useCrudForm({
    namespace,
    id,
    initialConfig,
    onSubmitted,
  });

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={title} />

      <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
        {/* ── Header ── */}
        <div className="border-b">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{title}</h1>
                {description && <p className="text-muted-foreground text-sm">{description}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {actionButtons}
              <Button type="submit" form="crud-form-page-inner" disabled={submitting || loading || !config}>
                {submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                {submitLabel ?? t('Save')}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Top notice slot ── */}
        {topNotice}

        {/* ── Loading state ── */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        )}

        {/* ── Fetch error ── */}
        {!loading && fetchError && (
          <div role="alert" className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
            {fetchError}
          </div>
        )}

        {/* ── Form ── */}
        {!loading && config && (
          <ConfigForm
            config={config}
            values={values}
            onFieldChange={setFieldValue}
            errors={errors}
            submitError={submitError}
            onSubmit={(payload) => void submit(payload)}
            submitting={submitting}
            showFooter={false}
            idPrefix="crud-form-page"
            formId="crud-form-page-inner"
          />
        )}
      </div>
    </AppLayout>
  );
}

export default CrudFormPage;
