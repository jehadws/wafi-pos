import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import http, { refreshCsrfToken } from '@/api/http';

vi.mock('axios', async () => {
    const actual = await vi.importActual<any>('axios');
    return {
        ...actual,
        default: {
            ...actual.default,
            get: vi.fn(),
            create: actual.default.create,
        },
    };
});

describe('HTTP Interceptor & Session Resilience', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('refreshCsrfToken calls /sanctum/csrf-cookie', async () => {
        const mockedAxiosGet = vi.mocked(axios.get);
        mockedAxiosGet.mockResolvedValueOnce({ data: {} });

        await refreshCsrfToken();
        expect(mockedAxiosGet).toHaveBeenCalledWith('/sanctum/csrf-cookie', expect.anything());
    });

    it('processes 419 CSRF error by attempting token refresh', async () => {
        const mockedAxiosGet = vi.mocked(axios.get);
        mockedAxiosGet.mockResolvedValueOnce({ data: {} });

        const error = {
            response: { status: 419 },
            config: { url: '/orders', headers: {} },
        };

        const interceptor = (http.interceptors.response as any).handlers[0];
        try {
            await interceptor.rejected(error);
        } catch {
            // expected rejection in mock environment
        }

        expect(mockedAxiosGet).toHaveBeenCalledWith('/sanctum/csrf-cookie', expect.anything());
    });

    it('dispatches pos:session-expired on 401 error', async () => {
        const eventSpy = vi.fn();
        window.addEventListener('pos:session-expired', eventSpy);

        const error = {
            response: { status: 401 },
            config: { url: '/orders' },
        };

        const interceptor = (http.interceptors.response as any).handlers[0];
        try {
            await interceptor.rejected(error);
        } catch {
            // expected rejection
        }

        expect(eventSpy).toHaveBeenCalled();
        window.removeEventListener('pos:session-expired', eventSpy);
    });
});
