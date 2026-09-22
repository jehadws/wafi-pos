import { del, get, post } from './http';

/**
 * Accounting / Transactions API — `/api/transactions*`, `/api/transactions-accounts/*`
 *
 * `sb.transactions` / `sb.transactions-history` / `sb.transactions-accounts`
 * row deletes/bulk-deletes are backend-driven (crud table engine); these
 * helpers serve the accounting-rules manager, the accounting settings page
 * and the api-transactions contract tests.
 */
export const transactionsApi = {
  /** Fetch the configured transaction rules. */
  getRules: () => get('/transactions/rules'),

  /** Create a transaction rule. */
  createRule: (rule: unknown) => post<{ message: string }>('/transactions/rules', { rule }),

  /** Delete a transaction rule. */
  deleteRule: (id: number | string) => del<{ message: string }>(`/transactions/rules/${id}`),

  /** Fetch all transaction accounts. */
  getAccounts: () => get('/transactions-accounts'),

  /** Fetch the available transaction account actions. */
  getAccountActions: () => get('/transactions-accounts/actions'),

  /** Fetch sub-accounts for a category identifier. */
  getCategoryIdentifier: (identifier: string, exclude = 0) => post('/transactions-accounts/category-identifier', { exclude, identifier }),

  /** Reset transaction accounts to their defaults. */
  resetAccountDefaults: () => get('/transactions-accounts/reset-defaults'),

  /** Fetch transaction form configurations. */
  getConfigurations: () => get('/transactions/configurations'),
};
