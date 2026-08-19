import { get } from './http';

/**
 * Units API — `/api/units`
 */
export const unitsApi = {
    /** Fetch all units. */
    getAll: () => get('/units'),
};
