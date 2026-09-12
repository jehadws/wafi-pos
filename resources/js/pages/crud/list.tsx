/**
 * pages/crud/list.tsx
 *
 * The SINGLE route component for every backend-driven list page
 * (Plan T2.8). `CrudService::table()` renders it through Inertia with the
 * `initialConfig` prop — pages do NOT get per-page React shells. From
 * Phase 3 on, a controller list method is simply
 * `return UnitCrud::table();`.
 */

import CrudTablePage from '@/components/tables/crud-table/crud-table-page';
import type { BreadcrumbItem } from '@/types';
import type { CrudTableConfig } from '@/types/tables';
import { usePage } from '@inertiajs/react';

export interface CrudListPageProps {
  namespace: string;
  initialConfig?: CrudTableConfig;
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  queryParams?: Record<string, string>;
  [key: string]: unknown;
}

export default function CrudListPage() {
  const { namespace, initialConfig, title, description, breadcrumbs, queryParams } = usePage<CrudListPageProps>().props;

  return (
    <CrudTablePage
      namespace={namespace}
      initialConfig={initialConfig}
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
      queryParams={queryParams}
    />
  );
}
