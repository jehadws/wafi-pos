/**
 * pages/crud/form.tsx
 *
 * The SINGLE route component for every backend-driven CRUD form page
 * (Plan: backend-driven-leftovers Phase 2). `CrudService::form()` renders it
 * through Inertia with the `initialConfig` prop — pages do NOT get per-page
 * React shells. From Phase 3 on, a controller form method is simply
 * `return RegisterCrud::form();` (create) or
 * `return RegisterCrud::form($register);` (edit).
 */

import CrudFormPage from '@/components/forms/config-form/crud-form-page';
import type { BreadcrumbItem } from '@/types';
import type { CrudFormConfig } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export interface CrudFormPageProps {
  namespace: string;
  initialConfig?: CrudFormConfig;
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  /**
   * Optional warning/notice banner rendered above the form
   * (e.g. transactions queue/expense-account warnings).
   */
  infoMessage?: string;
  [key: string]: unknown;
}

export default function CrudFormRoutePage() {
  const { namespace, initialConfig, title, description, breadcrumbs, infoMessage } = usePage<CrudFormPageProps>().props;

  return (
    <CrudFormPage
      namespace={namespace}
      initialConfig={initialConfig}
      title={title ?? ''}
      description={description}
      breadcrumbs={breadcrumbs}
      topNotice={infoMessage ? <div className="bg-accent/30 border-primary border-l border-l-3 p-2">{infoMessage}</div> : undefined}
    />
  );
}
