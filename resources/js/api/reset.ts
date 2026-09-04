import { post } from './http';

export type ResetMode = 'wipe_plus_grocery' | 'wipe_all' | string;

export interface ResetPayload {
    mode: ResetMode;
    create_sales?: boolean;
    create_procurements?: boolean;
}

export interface ResetResponse {
    status: 'success' | 'error';
    message: string;
}

/**
 * Reset API — `/api/reset`
 */
export const resetApi = {
    /** Perform database reset with selected mode and options */
    resetDatabase: (payload: ResetPayload) => post<ResetResponse>('/reset', payload),
};
