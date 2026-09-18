/**
 * bulk-actions.tsx
 *
 * Maps `config.bulkActions` into the shape the `DataTable` toolbar expects
 * (Plan T2.7). On run:
 *  - an optional confirm gate is honored when the backend definition carries
 *    a `confirm` payload (destructive styling for delete-type identifiers);
 *  - the action posts to `POST /crud/{namespace}/bulk-actions` with
 *    `{ action: identifier, entries: selectedIds }` (`crudApi.bulkActions`);
 *  - success toasts (JSON `message` or fallback) and refreshes the table;
 *    the toolbar clears the selection after invoking the callback;
 *  - an empty selection is guarded with an info toast (the backend throws
 *    "You need to select at least one item to delete" for direct calls).
 */

import { crudApi } from '@/api/crud';
import { useTranslation } from '@/lib/i18n';
import type { CrudBulkAction, CrudEntryRow, CrudTableConfig } from '@/types/tables';
import { getApiErrorMessage } from '@/utils/api-errors';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { responseMessage, type ExecutorConfirmState } from './use-action-executor';

export interface UseBulkActionsParams {
  config: CrudTableConfig;
  /** Opens THE shared confirm dialog (single-dialog rule with row actions). */
  requestConfirm: (request: ExecutorConfirmState) => Promise<boolean>;
  refresh: () => void;
}

/** The toolbar shape consumed by `DataTableToolbar`. */
export interface DataTableBulkAction {
  label: string;
  action: (selectedRows: CrudEntryRow[]) => void;
}

export function useBulkActions({ config, requestConfirm, refresh }: UseBulkActionsParams): {
  bulkActions: DataTableBulkAction[];
  running: string | null;
} {
  const { t } = useTranslation();
  const [running, setRunning] = useState<string | null>(null);

  const runBulkAction = useCallback(
    async (bulk: CrudBulkAction, rows: CrudEntryRow[]) => {
      // `$id` is the CrudEntry row identity; plain `id` is the fallback.
      const entries = rows.map((row) => (row.$id ?? row.id) as number | string);

      // Guard: no selection → info toast (the backend also throws for it).
      if (entries.length === 0) {
        toast.info(t('You need to select at least one item to delete'));
        return;
      }

      if (bulk.confirm?.message) {
        const accepted = await requestConfirm({
          title: bulk.confirm.title ?? t('Confirm Your Action'),
          message: bulk.confirm.message,
          destructive: /delete/i.test(bulk.identifier),
        });
        if (!accepted) {
          return;
        }
      }

      setRunning(bulk.identifier);
      try {
        const response = await crudApi.bulkActions(config.namespace, { action: bulk.identifier, entries });
        toast.success(responseMessage(response) ?? t('Successfully processed selected items'));
        refresh();
      } catch (error) {
        toast.error(getApiErrorMessage(error, t('Operation failed')));
      } finally {
        setRunning(null);
      }
    },
    [config.namespace, refresh, requestConfirm, t],
  );

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () =>
      (config.bulkActions ?? []).map((bulk) => ({
        label: bulk.label,
        // Returning the promise keeps the flow awaitable in tests; the
        // toolbar (void-returning prop) ignores it and clears the selection
        // right after invoking.
        action: (rows: CrudEntryRow[]) => runBulkAction(bulk, rows),
      })),
    [config.bulkActions, runBulkAction],
  );

  return { bulkActions, running };
}
