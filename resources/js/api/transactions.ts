import { del, get, post, put } from './http';

/**
 * Accounting / Transactions API — `/api/transactions*`, `/api/transactions-accounts/*`,
 * `/api/crud/sb.transactions`, `/api/crud/sb.transactions-history`, `/api/crud/sb.transactions-accounts`
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

    // ── CRUD — sb.transactions ──────────────────────────────────────────────

    /** Create a new transaction. */
    create: (data: unknown) => post('/crud/sb.transactions', data),

    /** Update an existing transaction. */
    update: (id: number | string, data: unknown) => put(`/crud/sb.transactions/${id}`, data),

    /** Delete a single transaction. */
    remove: (id: number | string) => del(`/crud/sb.transactions/${id}`),

    /** Bulk-delete transactions by ID. */
    bulkDelete: (ids: Array<number | string>) =>
        post('/crud/sb.transactions/bulk-actions', { action: 'delete_selected', entries: ids }),

    // ── CRUD — sb.transactions-history ─────────────────────────────────────

    /** Delete a single transaction history entry. */
    removeHistory: (id: number | string) => del(`/crud/sb.transactions-history/${id}`),

    /** Bulk-delete transaction history entries by ID. */
    bulkDeleteHistory: (ids: Array<number | string>) =>
        post('/crud/sb.transactions-history/bulk-actions', { action: 'delete_selected', entries: ids }),

    // ── CRUD — sb.transactions-accounts ────────────────────────────────────

    /** Create a new transaction account. */
    createAccount: (data: unknown) => post('/crud/sb.transactions-accounts', data),

    /** Delete a single transaction account. */
    removeAccount: (id: number | string) => del(`/crud/sb.transactions-accounts/${id}`),

    /** Bulk-delete transaction accounts by ID. */
    bulkDeleteAccounts: (ids: Array<number | string>) =>
        post('/crud/sb.transactions-accounts/bulk-actions', { action: 'delete_selected', entries: ids }),
};
