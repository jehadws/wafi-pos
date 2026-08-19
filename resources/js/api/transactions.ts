import { del, get, post } from './http';

/**
 * Accounting / Transactions API — `/api/transactions*`, `/api/transactions-accounts/*`
 */
export const transactionsApi = {
    /** Fetch the configured transaction rules. */
    getRules: () => get('/transactions/rules'),

    /** Create a transaction rule. */
    createRule: (rule: unknown) => post<{ message: string }>('/transactions/rules', { rule }),

    /**
     * Delete a transaction rule.
     *
     * FIXME(backend): the original code called `axios.delete(`/transactions/rules/${id}`)`
     * — missing the `/api` prefix — and no matching route exists in
     * routes/api/transactions.php. This client targets the corrected URL,
     * but the backend route still needs to be confirmed/added.
     */
    deleteRule: (id: number | string) => del<{ message: string }>(`/transactions/rules/${id}`),

    /** Fetch all transaction accounts. */
    getAccounts: () => get('/transactions-accounts'),

    /** Fetch the available transaction account actions. */
    getAccountActions: () => get('/transactions-accounts/actions'),

    /** Fetch sub-accounts for a category identifier. */
    getCategoryIdentifier: (identifier: string, exclude = 0) =>
        post('/transactions-accounts/category-identifier', { exclude, identifier }),

    /** Reset transaction accounts to their defaults. */
    resetAccountDefaults: () => get('/transactions-accounts/reset-defaults'),

    /** Fetch transaction form configurations. */
    getConfigurations: () => get('/transactions/configurations'),
};
