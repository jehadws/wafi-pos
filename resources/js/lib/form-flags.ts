/**
 * form-flags.ts
 *
 * Feature flag registry for the backend-driven form engine migration
 * (Plan B §B2.3).
 *
 * Each flag controls whether a specific CRUD/settings page uses the new
 * `CrudFormPage` / `SettingsFormPage` engine or the legacy hand-written JSX.
 * Flip a flag to `true` once you have migrated the page and verified it in
 * production.
 *
 * Usage:
 *
 *   import { isFormEngineEnabled } from '@/lib/form-flags';
 *
 *   if (isFormEngineEnabled('roles')) {
 *     return <CrudFormPage ... />;
 *   }
 *   return <LegacyRoleForm ... />;
 */

/**
 * All known migration flags.
 *
 * Naming convention: snake_case matching the CRUD namespace or settings
 * section identifier, e.g. `'sb.roles'` → flag key `'roles'`.
 */
export type FormEngineFlag =
  | 'roles'
  | 'units'
  | 'unit_groups'
  | 'taxes'
  | 'tax_groups'
  | 'customers'
  | 'customer_groups'
  | 'providers'
  | 'coupons'
  | 'payment_types'
  | 'cash_registers'
  | 'categories'
  | 'transactions'
  | 'transaction_accounts'
  | 'rewards'
  | 'settings_general'
  | 'settings_pos'
  | 'settings_orders'
  | 'settings_customers'
  | 'settings_accounting'
  | 'settings_reports'
  | 'settings_workers';

/**
 * Registry — set a flag to `true` once the corresponding page has been
 * fully migrated to the backend-driven engine.
 */
const FLAGS: Record<FormEngineFlag, boolean> = {
  roles: false,
  units: false,
  unit_groups: false,
  taxes: false,
  tax_groups: false,
  customers: false,
  customer_groups: false,
  providers: false,
  coupons: false,
  payment_types: false,
  cash_registers: false,
  categories: false,
  transactions: false,
  transaction_accounts: false,
  rewards: false,
  settings_general: false,
  settings_pos: false,
  settings_orders: false,
  settings_customers: false,
  settings_accounting: false,
  settings_reports: false,
  settings_workers: false,
};

/**
 * Returns `true` when the given page has been migrated to the engine.
 *
 * @param flag  The migration flag key (see `FormEngineFlag`).
 */
export function isFormEngineEnabled(flag: FormEngineFlag): boolean {
  return FLAGS[flag] === true;
}

/**
 * Override flags at runtime (e.g. in tests or feature previews).
 * Mutates the shared registry.
 */
export function setFormEngineFlag(flag: FormEngineFlag, enabled: boolean): void {
  FLAGS[flag] = enabled;
}

export default FLAGS;
