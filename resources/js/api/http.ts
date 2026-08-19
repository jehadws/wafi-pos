import axios, { AxiosError, AxiosRequestConfig } from 'axios';

/**
 * Shared HTTP client for the Wafi POS backend API.
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

// Global error interceptor — handles session and permission errors for
// every API call made through this client.
http.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const status = error.response?.status;

        if (status === 401 || status === 419) {
            // Session expired or CSRF token expired → send to login.
            window.location.href = '/login';
        } else if (status === 403) {
            // Authenticated but no permission → send to access-denied page.
            // Pass the current URL as `back` so the "Go Back" button works.
            const back = encodeURIComponent(window.location.href);
            window.location.href = `/errors/access-denied?back=${back}`;
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
