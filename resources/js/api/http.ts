import axios, { AxiosError, AxiosRequestConfig } from 'axios';

/**
 * Shared HTTP client for the Subul backend API.
 *
 * All API resource modules (customers, orders, products, ...) go through
 * this instance so that base URL, headers, and error handling live in
 * exactly one place instead of being copy-pasted across pages.
 */
export const http = axios.create({
  baseURL: '/api',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

let isRefreshingCsrf = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  config: AxiosRequestConfig;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(http(prom.config));
    }
  });
  failedQueue = [];
};

/**
 * Fetch a fresh CSRF cookie from Laravel Sanctum
 */
export async function refreshCsrfToken(): Promise<void> {
  try {
    await axios.get('/sanctum/csrf-cookie', {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
  } catch (e) {
    console.warn('[HTTP] Failed to refresh CSRF token cookie:', e);
    throw e;
  }
}

/**
 * Backup cart state snapshot before session teardown
 */
export function backupCartStateBeforeUnload(): void {
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('pos:session-expired'));
    }
  } catch {
    // Safe fallback
  }
}

// Global error interceptor — handles session, CSRF, and permission errors
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    // 1. Handle CSRF Token Expiration (419) with background refresh & replay
    if (status === 419 && originalRequest && !originalRequest._retry) {
      if (isRefreshingCsrf) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshingCsrf = true;

      try {
        await refreshCsrfToken();
        isRefreshingCsrf = false;
        processQueue(null);
        return http(originalRequest);
      } catch (refreshErr) {
        isRefreshingCsrf = false;
        processQueue(refreshErr);
        backupCartStateBeforeUnload();
        if (typeof window !== 'undefined' && currentPath !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    // 2. Handle 401 Unauthorized (Session Expired)
    if (status === 401) {
      backupCartStateBeforeUnload();
      if (typeof window !== 'undefined' && currentPath !== '/login') {
        const back = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${back}`;
      }
      return Promise.reject(error);
    }

    // 3. Handle 403 Forbidden (Permission Denied) - Guard against infinite loop
    if (status === 403) {
      if (typeof window !== 'undefined' && !currentPath.startsWith('/errors/access-denied') && currentPath !== '/login') {
        // Only redirect on full page context or if explicitly needed
        console.warn('[HTTP] 403 Forbidden on API request:', originalRequest?.url);
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

/** GET helper — resolves with the unwrapped response body. */
export async function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.get<T>(url, config);
  return data;
}

/** POST helper — resolves with the unwrapped response body. */
export async function post<T = any>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.post<T>(url, body, config);
  return data;
}

/** PUT helper — resolves with the unwrapped response body. */
export async function put<T = any>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.put<T>(url, body, config);
  return data;
}

/** DELETE helper — resolves with the unwrapped response body. */
export async function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.delete<T>(url, config);
  return data;
}

export default http;
