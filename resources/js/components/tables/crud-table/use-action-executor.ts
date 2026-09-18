/**
 * use-action-executor.ts
 *
 * The single orchestrator for every row action of the backend-driven table
 * engine (Plan T2.5).
 *
 * Semantics per action type (as defined by `CrudEntry::action()`):
 *  - **GOTO** → the absolute backend URL is normalized to an SPA path and
 *    visited with the Inertia router. (The T1.7 inventory confirmed the
 *    print-looking targets — orders invoice/receipt — are Inertia pages, so
 *    plain `router.visit` is always correct for today's GOTO set.)
 *  - **GET** → optional confirm dialog first, then `get(url)`; a success
 *    toast is shown only when the response is JSON carrying a `message`
 *    (several GET endpoints answer with `redirect()->back()` HTML); the
 *    table refreshes afterwards.
 *  - **DELETE** → confirm dialog (destructive) → `del(url)` → success toast
 *    (JSON message or fallback) → refresh.
 *  - **POPUP** → resolved through the popup registry (T2.6); an unregistered
 *    key falls back to navigating to `action.url` with a dev-time warning.
 *
 * Errors surface as `toast.error(getApiErrorMessage(...))` — 401/403/419
 * are already handled globally by `api/http.ts`. One confirm dialog at a
 * time; an in-flight guard prevents double-submits.
 */

import { del, get } from '@/api/http';
import { useTranslation } from '@/lib/i18n';
import type { CrudEntryRow, CrudRowAction } from '@/types/tables';
import { getApiErrorMessage } from '@/utils/api-errors';
import { router } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getActionPopup, popupKey } from './action-popup-registry';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UseActionExecutorParams {
  /** CRUD namespace — used for the popup registry key. */
  namespace: string;
  /** Re-fetch the entries after a mutating action. */
  refresh: () => void;
}

/** The single active confirm request, rendered by the shell. */
export interface ExecutorConfirmState {
  title: string;
  message?: string;
  destructive: boolean;
}

/** The popup action waiting to be rendered by the registry component. */
export interface ExecutorPopupState {
  action: CrudRowAction;
  row: CrudEntryRow;
}

export interface UseActionExecutorReturn {
  runAction: (row: CrudEntryRow, action: CrudRowAction) => Promise<void>;
  /** True while a GET/DELETE network operation is running. */
  inFlight: boolean;
  confirmState: ExecutorConfirmState | null;
  /**
   * Open THE confirm dialog (shared with bulk actions). Resolves `true`
   * when accepted, `false` when declined.
   */
  requestConfirm: (request: ExecutorConfirmState) => Promise<boolean>;
  acceptConfirm: () => void;
  declineConfirm: () => void;
  popupState: ExecutorPopupState | null;
  closePopup: () => void;
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ---------------------------------------------------------------------------

/**
 * Normalize an absolute backend URL (`sb()->url(...)`) to an SPA path the
 * Inertia router can visit.
 */
export function normalizeBackendUrl(url: string): string {
  return new URL(url, window.location.origin).pathname;
}

/**
 * Extract a success `message` from a JSON response body. HTML bodies
 * (`redirect()->back()` answers) are strings — never toasted.
 */
export function responseMessage(response: unknown): string | null {
  if (typeof response !== 'object' || response === null) {
    return null;
  }
  const message = (response as { message?: unknown }).message;
  return typeof message === 'string' && message ? message : null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useActionExecutor({ namespace, refresh }: UseActionExecutorParams): UseActionExecutorReturn {
  const { t } = useTranslation();

  const [inFlight, setInFlight] = useState(false);
  const [confirmState, setConfirmState] = useState<ExecutorConfirmState | null>(null);
  const [popupState, setPopupState] = useState<ExecutorPopupState | null>(null);

  /** Resolver of the currently open confirm dialog. */
  const confirmResolverRef = useRef<((accepted: boolean) => void) | null>(null);

  /**
   * Open THE confirm dialog. One dialog at a time — a still-pending older
   * request is declined implicitly.
   */
  const requestConfirm = useCallback((request: ExecutorConfirmState): Promise<boolean> => {
    confirmResolverRef.current?.(false);

    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmState(request);
    });
  }, []);

  const resolveConfirm = useCallback((accepted: boolean) => {
    const resolver = confirmResolverRef.current;
    confirmResolverRef.current = null;
    setConfirmState(null);
    resolver?.(accepted);
  }, []);

  const acceptConfirm = useCallback(() => resolveConfirm(true), [resolveConfirm]);
  const declineConfirm = useCallback(() => resolveConfirm(false), [resolveConfirm]);

  const closePopup = useCallback(() => {
    setPopupState(null);
  }, []);

  const runAction = useCallback(
    async (row: CrudEntryRow, action: CrudRowAction): Promise<void> => {
      if (inFlight) {
        return;
      }

      try {
        switch (action.type) {
          case 'GOTO': {
            router.visit(normalizeBackendUrl(action.url));
            return;
          }

          case 'GET': {
            if (action.confirm?.message) {
              const accepted = await requestConfirm({
                title: action.confirm.title ?? t('Confirm Your Action'),
                message: action.confirm.message,
                destructive: false,
              });
              if (!accepted) {
                return;
              }
            }

            setInFlight(true);
            const response = await get(action.url);

            // Toast only when the response is JSON with a message — some
            // GET endpoints answer with `redirect()->back()` HTML.
            const message = responseMessage(response);
            if (message) {
              toast.success(message);
            }

            refresh();
            return;
          }

          case 'DELETE': {
            const accepted = await requestConfirm({
              title: action.confirm?.title ?? t('Confirm Your Action'),
              message: action.confirm?.message ?? undefined,
              destructive: true,
            });
            if (!accepted) {
              return;
            }

            setInFlight(true);
            const response = await del(action.url);
            toast.success(responseMessage(response) ?? t('Successfully deleted selected item'));

            refresh();
            return;
          }

          case 'POPUP': {
            const component = getActionPopup(namespace, action.identifier);

            if (!component) {
              if (import.meta.env?.DEV) {
                console.warn(
                  `[crud-table] No popup registered for "${popupKey(namespace, action.identifier)}" — navigating to ${action.url} instead.`,
                );
              }
              router.visit(normalizeBackendUrl(action.url));
              return;
            }

            setPopupState({ action, row });
            return;
          }

          default:
            return;
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, t('Operation failed')));
      } finally {
        setInFlight(false);
      }
    },
    [inFlight, namespace, refresh, requestConfirm, t],
  );

  return {
    runAction,
    inFlight,
    confirmState,
    requestConfirm,
    acceptConfirm,
    declineConfirm,
    popupState,
    closePopup,
  };
}

export default useActionExecutor;
