/**
 * row-actions-menu.tsx
 *
 * The generic row menu of the backend-driven table engine (Plan T2.4).
 *
 * Rules:
 *  - Items are rendered strictly from `row.$actions`, in the backend's
 *    insertion order (`CrudEntry::action()` calls). No action is ever
 *    hardcoded or filtered client-side — the backend already stripped the
 *    actions the user may not run (`CrudEntry::filterActions()`).
 *  - Actions with `type === 'DELETE'` get the destructive styling.
 *  - Exactly one built-in **Copy ID** item closes the menu (decision log,
 *    `docs/backend-driven-tables-audit.md`); it copies `row.$id ?? row.id`.
 *  - Clicks delegate to the T2.5 action executor; the trigger disables
 *    while an action is in-flight.
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/lib/i18n';
import type { CrudEntryRow, CrudRowAction } from '@/types/tables';
import { Copy, MoreHorizontal } from 'lucide-react';

export interface RowActionsMenuProps {
  row: CrudEntryRow;
  /** The action executor dispatcher (T2.5). */
  onRunAction: (row: CrudEntryRow, action: CrudRowAction) => void;
  /** Disables the trigger while an action is in-flight. */
  disabled?: boolean;
}

export function RowActionsMenu({ row, onRunAction, disabled = false }: RowActionsMenuProps) {
  const { t } = useTranslation();

  // Object.values preserves the backend insertion order of `$actions`.
  const actions = Object.values(row.$actions ?? {});

  const handleCopyId = () => {
    void navigator.clipboard.writeText(String(row.$id ?? row.id));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={disabled}>
          <span className="sr-only">{t('Open menu')}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('Options')}</DropdownMenuLabel>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.identifier}
            onClick={() => onRunAction(row, action)}
            className={action.type === 'DELETE' ? 'text-destructive' : undefined}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyId}>
          <Copy className="me-2 h-4 w-4" />
          {t('Copy ID')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default RowActionsMenu;
