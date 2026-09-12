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

import { get } from '@/api/http';
import OrderOptionsDialog from '@/components/forms/orders/order-options-dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import type { CrudEntryRow, CrudRowAction } from '@/types/tables';
import { useEffect, useRef, useState, type ComponentType } from 'react';
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
