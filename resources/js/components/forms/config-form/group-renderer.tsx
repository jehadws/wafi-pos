/**
 * group-renderer.tsx
 *
 * Renders a repeatable sub-form group (`field.type === 'group'`).
 * Each row is an independent set of child fields drawn from `field.fields`.
 * Rows can be added (via an "Add row" button) and removed (per-row close button,
 * when `closable !== false`).
 *
 * Backend source of truth: the `group` field shape in `CrudInput.php`.
 * Pre-filled rows come from `field.groups` (set by the backend on edit).
 */

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import type { FormFieldDef } from '@/types/forms';
import type { GroupFieldDef } from '@/types/forms';
import { FieldRenderer } from './field-renderer';

export interface GroupRendererProps {
  field: GroupFieldDef;
  /** Current value: array of row value maps. */
  value: Array<Record<string, unknown>>;
  onChange: (rows: Array<Record<string, unknown>>) => void;
  errors?: Record<string, string[]>;
  disabled?: boolean;
}

/** Build a default (empty) row from a list of child field definitions. */
function defaultRow(fields: FormFieldDef[]): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.name !== undefined) {
      row[f.name] = f.value ?? '';
    }
  }
  return row;
}

export function GroupRenderer({ field, value, onChange, errors = {}, disabled = false }: GroupRendererProps) {
  const { t } = useTranslation();
  const closable = field.closable !== false;
  const rows = Array.isArray(value) ? value : [];

  function handleRowChange(rowIndex: number, fieldName: string, fieldValue: unknown) {
    const next = rows.map((row, idx) => (idx === rowIndex ? { ...row, [fieldName]: fieldValue } : row));
    onChange(next);
  }

  function handleAddRow() {
    onChange([...rows, defaultRow(field.fields)]);
  }

  function handleRemoveRow(rowIndex: number) {
    onChange(rows.filter((_, idx) => idx !== rowIndex));
  }

  return (
    <div className="space-y-4">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="rounded-md border p-4"
          data-testid={`group-row-${rowIndex}`}
        >
          {/* Per-row fields */}
          <div className="space-y-3">
            {field.fields.map((childField, fieldIndex) => {
              const name = childField.name ?? String(fieldIndex);
              // Per-row overrides: a field marked disabled in the row data wins.
              const rowOverride = (row[`__${name}_disabled`] as boolean | undefined) ?? false;
              const fieldError = errors[`${rowIndex}.${name}`]?.[0];

              return (
                <FieldRenderer
                  key={name}
                  field={{ ...childField, disabled: childField.disabled || rowOverride }}
                  value={row[name]}
                  onChange={(val) => handleRowChange(rowIndex, name, val)}
                  error={fieldError}
                  disabled={disabled || childField.disabled || rowOverride}
                  id={`group-${field.name ?? 'row'}-${rowIndex}-${name}`}
                />
              );
            })}
          </div>

          {/* Row remove button */}
          {closable && !disabled && (
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t('Remove row')}
                onClick={() => handleRemoveRow(rowIndex)}
              >
                {t('Remove')}
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Add row */}
      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={handleAddRow} aria-label={t('Add row')}>
          {t('Add row')}
        </Button>
      )}
    </div>
  );
}

export default GroupRenderer;
