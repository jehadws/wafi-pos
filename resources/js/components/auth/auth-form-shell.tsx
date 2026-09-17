/**
 * auth-form-shell.tsx
 *
 * Reusable renderer for every Phase-5-migrated auth page.
 *
 * Accepts a flat FormFieldDef[] + submit endpoint + optional slots,
 * and composes: Inertia useForm (auto-populated from field names),
 * FieldRenderer loop per field, card container, status flash banner,
 * and submit button with loading state.
 *
 * Contract is URL-agnostic: pages convert route() names to URLs
 * before passing — shell does not couple to the Ziggy route() helper.
 */
import type { FormFieldDef } from '@/types/forms';
import { router, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FieldRenderer } from '@/components/forms/config-form/field-renderer';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { FormEvent, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AuthFormShellProps {
  fields: FormFieldDef[];
  initialValues?: Record<string, unknown>;
  submitUrl: string;
  submitLabel?: string;
  submitMethod?: 'post' | 'put';
  onSuccessRedirect?: string | null;
  processing?: boolean;
  errors?: Record<string, string>;
  topSlot?: ReactNode;
  bottomLinks?: ReactNode;
  statusBanner?: string | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialData(
  fields: FormFieldDef[],
  initialValues?: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const name = field.name;
    if (!name) continue;
    if (initialValues && name in initialValues) {
      out[name] = initialValues[name];
    } else if (Object.prototype.hasOwnProperty.call(field, 'default') && field.default !== undefined) {
      out[name] = field.default;
    } else if (field.type === 'checkbox') {
      out[name] = false;
    } else {
      out[name] = '';
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuthFormShell({
  fields,
  initialValues,
  submitUrl,
  submitLabel,
  submitMethod = 'post',
  onSuccessRedirect = null,
  processing: externalProcessing,
  errors: externalErrors,
  topSlot,
  bottomLinks,
  statusBanner,
  className,
}: AuthFormShellProps) {
  const { t } = useTranslation();

  const initialData = buildInitialData(fields, initialValues) as Record<string, any>;
  const form = useForm(initialData);
  const { data, setData, post, put, processing, errors, clearErrors } = form;

  const isProcessing = externalProcessing ?? processing;
  const displayErrors = externalErrors ?? errors;

  function submitHandler(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    clearErrors();

    const opts: Parameters<typeof post>[1] = {
      preserveScroll: true,
      preserveState: false,
      onSuccess: () => {
        if (onSuccessRedirect) {
          router.visit(onSuccessRedirect);
        }
      },
    };

    if (submitMethod === 'put') {
      put(submitUrl, opts);
    } else {
      post(submitUrl, opts);
    }
  }

  return (
    <Card className={cn('w-full sm:max-w-md', className)}>
      <div className="px-6">
        {statusBanner && (
          <Alert className="mb-4" role="status">
            {statusBanner}
          </Alert>
        )}

        {topSlot}

        <form onSubmit={submitHandler} noValidate>
          <div className="space-y-4">
            {fields.map((field, index) => {
              const name = field.name;
              if (!name) return null;

              const fieldError: string | undefined = (() => {
                const maybe = displayErrors[name];
                return typeof maybe === 'string' ? maybe : undefined;
              })();

              return (
                <FieldRenderer
                  key={name}
                  field={field}
                  value={data[name]}
                  onChange={(value) => setData(name, value)}
                  error={fieldError}
                  disabled={isProcessing}
                  id={`auth-shell-${name}-${index}`}
                />
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-end gap-4">
            {bottomLinks}
            <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto">
              {isProcessing && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {submitLabel ?? t('Submit')}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

export default AuthFormShell;
