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
 * `sb.order-refunds` (Wave 2), plus the Phase-5 history popups
 * (`sb.cash-registers-history::view-details`,
 * `sb.products-histories::sb.description`). `sb.products::sb.quantities`
 * keeps its URL, so an unregistered fallback still navigates somewhere
 * meaningful (the product edit page).
 */

import { get } from '@/api/http';
import OrderOptionsDialog from '@/components/forms/orders/order-options-dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import type { CrudEntryRow, CrudRowAction } from '@/types/tables';
import { Fragment, useEffect, useRef, useState, type ComponentType } from 'react';
import { PopupDialog } from './popup-dialog';

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

// ---------------------------------------------------------------------------
// Seeded Wave-2 popups (orders) — from the T1.6 POPUP enumeration
// ---------------------------------------------------------------------------

/**
 * `sb.orders::sb.order-options` — the order options modal (details,
 * payments, instalments, refunds). The backend URL points at the orders
 * edit page; the modal itself fetches through `ordersApi`, so the row id is
 * what matters here.
 */
function OrderOptionsPopup({ open, onClose, row }: ActionPopupProps) {
  const orderId = Number(row.$id ?? row.id);

  return <OrderOptionsDialog open={open} orderId={Number.isFinite(orderId) ? orderId : null} onOpenChange={(next) => !next && onClose()} />;
}

registerActionPopup('sb.orders', 'sb.order-options', OrderOptionsPopup);

/**
 * `sb.orders::sb.order-refunds` — the refund receipt. The URL answers with
 * direct Blade HTML (T1.7), so the popup fetches the content and renders it
 * in an iframe; printing targets the iframe document.
 */
function RefundReceiptPopup({ open, onClose, action }: ActionPopupProps) {
  const { t } = useTranslation();
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !action.url) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    get<string>(action.url)
      .then((content) => {
        if (!cancelled) {
          setHtml(typeof content === 'string' ? content : '');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHtml('');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, action.url]);

  const handlePrint = () => {
    frameRef.current?.contentWindow?.print();
  };

  return (
    <PopupDialog open={open} onOpenChange={(next) => !next && onClose()} title={t('Refund Receipt')} className="sm:max-w-3xl">
      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="text-muted-foreground flex h-[60vh] items-center justify-center text-sm">{t('Loading...')}</div>
        ) : (
          <iframe ref={frameRef} title={t('Refund Receipt')} srcDoc={html} className="h-[60vh] w-full border" />
        )}
        <Button type="button" variant="outline" onClick={handlePrint} disabled={loading} className="self-end">
          {t('Print')}
        </Button>
      </div>
    </PopupDialog>
  );
}

registerActionPopup('sb.orders', 'sb.order-refunds', RefundReceiptPopup);

// ---------------------------------------------------------------------------
// Phase-5 popups (secondary/history pages) — T5.4. Both POPUP actions carry
// no URL: every field they show ships pre-formatted on the row itself.
// ---------------------------------------------------------------------------

/**
 * `sb.products-histories::sb.description` — the stock-history entry
 * description. The (potentially long) description text ships on the row.
 */
function ProductHistoryDescriptionPopup({ open, onClose, row }: ActionPopupProps) {
  const { t } = useTranslation();
  const description = typeof row.description === 'string' && row.description.trim().length > 0 ? row.description : null;

  return (
    <PopupDialog open={open} onOpenChange={(next) => !next && onClose()} title={t('Description')} className="sm:max-w-lg">
      <p className="text-sm whitespace-pre-wrap">{description ?? t('No description provided for this entry.')}</p>
    </PopupDialog>
  );
}

registerActionPopup('sb.products-histories', 'sb.description', ProductHistoryDescriptionPopup);

/**
 * `sb.cash-registers-history::view-details` — the register history details
 * popup. `RegisterHistoryCrud::setActions` formats action labels, money and
 * dates server-side, so the popup only lays the row fields out.
 */

/** Row-field → display string (`null` when the field carries no text). */
function stringField(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return String(value);
}

function RegisterHistoryDetailsPopup({ open, onClose, row }: ActionPopupProps) {
  const { t } = useTranslation();

  const details = (
    [
      { label: t('Register'), value: stringField(row.register_name) ?? stringField(row.register_id) },
      { label: t('Author'), value: stringField(row.user_username) },
      { label: t('Action'), value: stringField(row.action) },
      { label: t('Value'), value: stringField(row.value) },
      { label: t('Initial Balance'), value: stringField(row.balance_before) },
      { label: t('New Balance'), value: stringField(row.balance_after) },
      { label: t('Transaction Type'), value: stringField(row.transaction_type) },
      { label: t('Done At'), value: stringField(row.created_at) },
      { label: t('Uuid'), value: stringField(row.uuid) },
    ] as Array<{ label: string; value: string | null }>
  ).filter((detail): detail is { label: string; value: string } => detail.value !== null);

  return (
    <PopupDialog open={open} onOpenChange={(next) => !next && onClose()} title={t('Register History Details')} className="sm:max-w-lg">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {details.map((detail) => (
          <Fragment key={detail.label}>
            <dt className="text-muted-foreground whitespace-nowrap">{detail.label}</dt>
            <dd className="break-all font-medium">{detail.value}</dd>
          </Fragment>
        ))}
      </dl>
    </PopupDialog>
  );
}

registerActionPopup('sb.cash-registers-history', 'view-details', RegisterHistoryDetailsPopup);
