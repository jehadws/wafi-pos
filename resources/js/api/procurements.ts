import { get, post } from './http';

/**
 * Procurements API — `/api/procurements/*`, `/api/units-groups/*`
 */
export const procurementsApi = {
    /** Search products while building a procurement. */
    searchProduct: (search: string) => post('/procurements/products/search-product', { search }),

    /** Search products and procurements for stock adjustment. */
    searchProcurementProduct: (argument: string) => post('/procurements/products/search-procurement-product', { argument }),

    /** Fetch the units belonging to a unit group. */
    getUnitGroupUnits: (groupId: number | string) => get(`/units-groups/${groupId}/units`),
};
