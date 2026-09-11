import FormField from '@/components/forms/shared/form-field';
import { FilePicker } from '@/components/settings/general/file-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import MultiKeySelector from '@/components/ui/multi-key-selector';
import { MultiSelector } from '@/components/ui/multi-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n';
import type { FormFieldDef, FormOption, GroupFieldDef } from '@/types/forms';
import type React from 'react';
import { useRef } from 'react';
import { GroupRenderer } from './group-renderer';
import { parseValidation } from './parse-validation';
import { getCustomComponent } from './registry';
import { RichTextEditor } from './rich-text-editor';

/**
 * Renders one backend form field, mapping `field.type` to a UI primitive
 * (see `docs/plans/form-sync-plan-a-hybrid.md` §4). The renderer is
 * controlled: the parent owns `value`/`onChange`. Options are always
 * rendered from `field.options` — the backend computes them per request
 * (and may disable choices, e.g. `WorkersSettings.php:39-50`), so the
 * frontend never derives choices on its own.
 */

export interface FieldRendererProps {
  field: FormFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  id?: string;
}

/** `switch` fields carry explicit `{label, value}` options — never booleans. */
function SwitchButtons({ field, value, onChange, disabled }: Pick<FieldRendererProps, 'field' | 'value' | 'onChange' | 'disabled'>) {
  const { t } = useTranslation();
  const options: FormOption[] = Array.isArray(field.options) ? field.options : [];

  return (
    <div className="flex items-center gap-2">
      {options.map((option) => (
        <Button
          key={String(option.value)}
          type="button"
          variant={String(option.value) === String(value ?? '') ? 'default' : 'outline'}
          className="border"
          disabled={disabled || option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
      {options.length === 0 && <p className="text-muted-foreground text-sm">{t('No options available.')}</p>}
    </div>
  );
}

function errorOf(field: FormFieldDef, explicit?: string): string | undefined {
  if (explicit) {
    return explicit;
  }
  const seeded = field.errors;
  if (Array.isArray(seeded) && seeded.length > 0 && typeof seeded[0] === 'string') {
    return seeded[0];
  }
  if (typeof seeded === 'string' && seeded) {
    return seeded;
  }
  return undefined;
}

function SelectField({
  field,
  value,
  onChange,
  disabled,
  id,
  hasError,
}: Pick<FieldRendererProps, 'field' | 'value' | 'onChange' | 'disabled' | 'id'> & { hasError?: boolean }) {
  const { t } = useTranslation();
  const options: FormOption[] = Array.isArray(field.options) ? field.options : [];
  const selectValue = value === undefined || value === null ? '' : String(value);

  return (
    <Select
      value={selectValue === '' ? undefined : selectValue}
      onValueChange={(next) => {
        // Restore the original option value type (ids stay numbers).
        const match = options.find((option) => String(option.value) === next);
        onChange(match ? match.value : next);
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full" aria-invalid={Boolean(hasError)}>
        <SelectValue placeholder={t('Select an option')} />
      </SelectTrigger>
      <SelectContent>
        {/* Radix Select cannot represent an empty-string item; empty
                    options are skipped and the placeholder stands in for them. */}
        {options
          .filter((option) => String(option.value) !== '')
          .map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

/**
 * `select-audio` — a select dropdown paired with a play button that previews
 * the currently-selected audio file (URL stored as the option value).
 */
function AudioSelectField({
  field,
  value,
  onChange,
  disabled,
  id,
  hasError,
}: Pick<FieldRendererProps, 'field' | 'value' | 'onChange' | 'disabled' | 'id'> & { hasError?: boolean }) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const src = typeof value === 'string' && value ? value : null;

  function handlePlay() {
    if (!src) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
    } else {
      audioRef.current.src = src;
    }
    void audioRef.current.play();
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <SelectField field={field} value={value} onChange={onChange} disabled={disabled} id={id} hasError={hasError} />
      </div>
      <Button type="button" variant="outline" size="icon" aria-label={t('Preview audio')} disabled={disabled || !src} onClick={handlePlay}>
        {/* Simple play triangle via SVG — no icon library dependency */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </Button>
    </div>
  );
}

export function FieldRenderer({ field, value, onChange, error, disabled, id }: FieldRendererProps) {
  const { t } = useTranslation();

  const type = field.type ?? 'text';
  const shownError = errorOf(field, error);
  const isDisabled = disabled || field.disabled === true;
  const required = parseValidation(field.validation).required;

  const stringValue = value === undefined || value === null ? '' : String(value);
  const textProps = {
    id,
    value: stringValue,
    disabled: isDisabled,
    'aria-invalid': Boolean(shownError),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  };

  // Custom components win over the type mapping (search-select + sbCrudForm, custom, …).
  const customName =
    field.component ??
    (field.name && getCustomComponent(field.name) ? field.name : undefined) ??
    (type === 'custom' ? String(field.name ?? '') : undefined);
  if (customName) {
    const Custom = getCustomComponent(customName);
    if (Custom) {
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError} htmlFor={id}>
          <Custom field={field} value={value} onChange={onChange} error={shownError} disabled={isDisabled} id={id} />
        </FormField>
      );
    }
    if (import.meta.env.DEV) {
      console.warn(`[ConfigForm] No custom component registered for "${customName}" — field hidden.`);
    }
    return null;
  }

  switch (type) {
    case 'text':
    case 'password':
    case 'email':
    case 'number':
    case 'tel':
    case 'date':
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError} htmlFor={id}>
          <Input type={type} {...textProps} />
        </FormField>
      );

    case 'datetimepicker':
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError} htmlFor={id}>
          <Input type="datetime-local" {...textProps} />
        </FormField>
      );

    case 'hidden':
      // No visible chrome — the value still participates in the payload.
      return <Input type="hidden" id={id} value={stringValue} onChange={(event) => onChange(event.target.value)} />;

    case 'textarea':
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError} htmlFor={id}>
          <Textarea {...textProps} />
        </FormField>
      );

    case 'ckeditor':
      // B1.5: replaced the Plan A textarea downgrade with the lightweight
      // contenteditable RichTextEditor (no external dep; HTML string interface).
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError} htmlFor={id}>
          <RichTextEditor id={id} value={stringValue} onChange={onChange} disabled={isDisabled} aria-invalid={Boolean(shownError)} />
        </FormField>
      );

    case 'select':
    case 'search-select':
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError} htmlFor={id}>
          <SelectField field={field} value={value} onChange={onChange} disabled={isDisabled} id={id} hasError={Boolean(shownError)} />
        </FormField>
      );

    case 'select-audio':
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError} htmlFor={id}>
          <AudioSelectField field={field} value={value} onChange={onChange} disabled={isDisabled} id={id} hasError={Boolean(shownError)} />
        </FormField>
      );

    case 'switch':
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError}>
          <SwitchButtons field={field} value={value} onChange={onChange} disabled={isDisabled} />
        </FormField>
      );

    case 'multiselect': {
      const options = (Array.isArray(field.options) ? field.options : []).map((option) => ({
        id: option.value as string | number,
        name: option.label,
        disabled: option.disabled,
      }));
      const selected = Array.isArray(value) ? (value as Array<string | number>) : [];
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError}>
          <MultiSelector options={options} value={selected} onChange={onChange} disabled={isDisabled} />
        </FormField>
      );
    }

    case 'inline-multiselect': {
      const selected = Array.isArray(value) ? (value as string[]) : null;
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError}>
          <MultiKeySelector
            options={(Array.isArray(field.options) ? field.options : []).map((option) => ({
              label: option.label,
              value: String(option.value),
            }))}
            value={selected}
            onChange={(keys) => onChange(keys)}
            disabled={isDisabled}
          />
        </FormField>
      );
    }

    case 'checkbox':
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError}>
          <div className="flex items-center gap-2">
            <Checkbox
              id={id}
              disabled={isDisabled}
              checked={value === '1' || value === 1 || value === true}
              onCheckedChange={(checked) => onChange(checked ? '1' : '')}
            />
          </div>
        </FormField>
      );

    case 'media':
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError}>
          <FilePicker
            value={typeof value === 'string' && value ? value : null}
            onChange={(next) => onChange(next ?? '')}
            placeholder={field.label ?? t('Pick a file')}
          />
        </FormField>
      );

    case 'daterangepicker': {
      // No live consumer today (Plan A §4); the bridge serializes the
      // range as `{from, to}` ISO date strings and parses the same back.
      const raw = (typeof value === 'object' && value !== null ? value : {}) as {
        from?: string;
        to?: string;
      };
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError}>
          <DateRangePicker
            dateRange={{
              from: raw.from ? new Date(raw.from) : undefined,
              to: raw.to ? new Date(raw.to) : undefined,
            }}
            onDateRangeChange={(next) =>
              onChange({
                from: next?.from ? next.from.toISOString() : '',
                to: next?.to ? next.to.toISOString() : '',
              })
            }
            disabled={isDisabled}
          />
        </FormField>
      );
    }

    case 'group': {
      const groupField = field as GroupFieldDef;
      const groupRows = Array.isArray(value) ? (value as Array<Record<string, unknown>>) : (groupField.groups ?? []);
      return (
        <FormField label={field.label ?? ''} description={field.description} required={required} error={shownError}>
          <GroupRenderer
            field={groupField}
            value={groupRows}
            onChange={onChange as (rows: Array<Record<string, unknown>>) => void}
            disabled={isDisabled}
          />
        </FormField>
      );
    }

    case 'custom':
    default:
      if (import.meta.env.DEV) {
        console.warn(`[ConfigForm] Unsupported field type "${type}" (name: ${field.name ?? 'n/a'}) — field hidden.`);
      }
      return null;
  }
}

export default FieldRenderer;
