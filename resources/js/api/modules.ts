import type { AxiosRequestConfig } from 'axios';
import { get, post, put, del } from './http';
import type { ModuleActionResponse, ModuleListResponse, ModuleStatus } from '@/types/models/module';

/**
 * Modules API — `/api/modules/*` (list, enable, disable, delete, upload)
 * Download and migrate hit the web routes (`/dashboard/modules/...`)
 * because they expose binary/download responses and page-level flows.
 */
export const modulesApi = {
  list: (status?: ModuleStatus) =>
    get<ModuleListResponse>(status && status !== 'all' ? `/modules/${status}` : '/modules'),

  enable: (name: string) => put<ModuleActionResponse>(`/modules/${name}/enable`),

  disable: (name: string) => put<ModuleActionResponse>(`/modules/${name}/disable`),

  delete: (name: string) => del<ModuleActionResponse>(`/modules/${name}/delete`),

  upload: (form: FormData, config?: AxiosRequestConfig) => post<ModuleActionResponse>('/modules', form, config),

  downloadUrl: (identifier: string) => `/dashboard/modules/download/${identifier}`,

  migrateUrl: (namespace: string) => `/dashboard/modules/migrate/${namespace}`,
};
