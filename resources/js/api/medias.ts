import { AxiosRequestConfig } from 'axios';
import { get, post } from './http';

/**
 * Medias API — `/api/medias/*`
 */
export const mediasApi = {
  /**
   * Upload a media file. Pass an AxiosRequestConfig to wire
   * `signal`, `onUploadProgress` and multipart headers.
   */
  upload: (form: FormData, config?: AxiosRequestConfig) => post('/medias', form, config),

  /** List medias with pagination and optional search. */
  list: <T = any>(page: number, search: string) => get<T>(`/medias`, { params: { page, search } }),

  /** Delete several medias at once. */
  bulkDelete: (ids: number[]) => post('/medias/bulk-delete', { ids }),
};
