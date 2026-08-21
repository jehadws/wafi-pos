import { Tax } from '@/types/models/tax';
import { get } from './http';

/**
 * Taxes API — `/api/taxes/*`
 */
export const taxesApi = {
    /** Fetch all tax groups. */
    getGroups: () => get('/taxes/groups'),

    /** Fetch a tax group (with its taxes) by id. */
    getGroup: (id: number | string) => get<Tax>(`/taxes/groups/${id}`),
};
