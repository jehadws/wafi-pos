/**
 * action-popup-registry.tsx
 *
 * Registry for POPUP row actions, keyed `namespace::identifier` — the
 * tables counterpart of the forms `registry.ts` (Plan T2.6). Components
 * self-register at module scope (see the seeded orders popups below), so
 * the executor never imports them statically.
 *
 * An action whose key is not registered resolves to `null` and the action
 * executor falls back to navigating to `action.url` (with a dev-time
 * warning), mirroring `field-renderer.tsx` for unknown form components.
 *
 * The seed set comes from the T1.6 POPUP enumeration
 * (`docs/backend-driven-tables-audit.md`): orders `sb.order-options` /
 * `sb.order-refunds` first (Wave 2); products preview/quantities,
 * register-history details and product-history description follow when
 * their pages migrate.
 */

import type { CrudEntryRow, CrudRowAction } from '@/types/tables';
import type { ComponentType } from 'react';

/** Props every registered popup component receives from the shell. */
export interface ActionPopupProps {
  open: boolean;
  onClose: () => void;
  /** The raw POPUP action definition. */
  action: CrudRowAction;
  /** The row the action was invoked on. */
  row: CrudEntryRow;
}

export type ActionPopupComponent = ComponentType<ActionPopupProps>;

const components = new Map<string, ActionPopupComponent>();

/** Registry key for a POPUP action. */
export function popupKey(namespace: string, identifier: string): string {
  return `${namespace}::${identifier}`;
}

/** Register a popup component under its `namespace::identifier` key (idempotent, last wins). */
export function registerActionPopup(namespace: string, identifier: string, component: ActionPopupComponent): void {
  components.set(popupKey(namespace, identifier), component);
}

/** Resolve a POPUP action; `null` when unregistered (executor falls back to navigation). */
export function getActionPopup(namespace: string, identifier: string): ActionPopupComponent | null {
  return components.get(popupKey(namespace, identifier)) ?? null;
}

/** Test helper — drop every registration. */
export function clearActionPopups(): void {
  components.clear();
}
