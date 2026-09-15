import { crudApi } from '@/api/crud';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import type { CrudFormConfig, FormFieldDef, FormOption } from '@/types/forms';
import { extractValidationErrors, getApiErrorMessage } from '@/utils/api-errors';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ConfigForm, initialValuesFromConfig } from './config-form';
import type { CustomFieldComponentProps } from './registry';
import { registerCustomComponent } from './registry';

/**
 * `sbCrudForm` / `sbCreateCoupons` — a backend-defined search-select whose
 * "+" trigger opens the referenced CRUD's form (`field.props`, a full
 * `CrudFormConfig` embedded server-side by `*Crud::getFormConfig()`) in a
 * modal, creates the entity, and selects the new option.
 *
 * Behavior spec: `docs/plans/form-sync-plan-a-hybrid.md` §6.
 * Payload contract: `SbForms::getFlatForm` — the backend drops `''`/`null`,
 * so empty modal fields are simply omitted from the create body.
 */

type SbCrudFormProps = CustomFieldComponentProps;

function resolveEmbeddedConfig(field: FormFieldDef): CrudFormConfig | null {
  const props = field.props as Partial<CrudFormConfig> | undefined;
  if (props && typeof props === 'object' && props.form && props.links) {
    return props as CrudFormConfig;
  }
  return null;
}

function resolveNamespace(field: FormFieldDef): string | undefined {
  const props = field.props as Partial<CrudFormConfig> | undefined;
  if (props && typeof props.namespace === 'string') {
    return props.namespace;
  }
  if (typeof (field as { namespace?: string }).namespace === 'string') {
    return (field as { namespace?: string }).namespace;
  }
  return undefined;
}

/** `optionAttributes` (`{label: 'name', value: 'id'}`) → option for the select. */
function entryToOption(entry: Record<string, unknown>, config: CrudFormConfig): FormOption {
  const attributes = config.optionAttributes;
  const labelAttribute = (typeof attributes === 'string' ? attributes : attributes?.label) || 'name';
  const rawLabel = entry[labelAttribute] ?? entry.label ?? entry.name ?? '';
  const rawValue = entry.id ?? entry.value ?? '';

  return { label: String(rawLabel), value: rawValue as FormOption['value'] };
}

export function SbCrudForm({ field, value, onChange, error, disabled, id }: SbCrudFormProps) {
  const { t } = useTranslation();

  const embedded = useMemo(() => resolveEmbeddedConfig(field), [field]);
  const namespace = useMemo(() => resolveNamespace(field), [field]);

  // Server options arrive via Inertia props and are re-created every
  // render; entities created in this session are kept separately and
  // merged so the fresh selection never loses its label.
  const serverOptions = useMemo(() => (Array.isArray(field.options) ? field.options : []), [field.options]);
  const [createdEntries, setCreatedEntries] = useState<FormOption[]>([]);
  const options = useMemo(() => {
    const known = new Set(serverOptions.map((option) => String(option.value)));
    return [...serverOptions, ...createdEntries.filter((option) => !known.has(String(option.value)))];
  }, [serverOptions, createdEntries]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<CrudFormConfig | null>(embedded);
  const [modalValues, setModalValues] = useState<Record<string, unknown>>({});
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [probeFailed, setProbeFailed] = useState(false);

  const selectValue = value === undefined || value === null ? '' : String(value);
  const selectedOption = options.find((option) => String(option.value) === selectValue);
  const showTrigger = !disabled && !probeFailed && Boolean(modalConfig || namespace);

  const openModal = async () => {
    if (modalConfig) {
      setModalValues(initialValuesFromConfig(modalConfig));
      setModalErrors({});
      setSubmitError(undefined);
      setModalOpen(true);
      return;
    }

    if (!namespace) {
      return;
    }

    try {
      const fetched = await crudApi.formConfig<CrudFormConfig>(namespace);
      setModalConfig(fetched);
      setModalValues(initialValuesFromConfig(fetched));
      setModalErrors({});
      setSubmitError(undefined);
      setModalOpen(true);
    } catch (fetchError) {
      // Permission denied (`allowedTo` in getFormConfig) or network
      // failure: hide the trigger permanently, never block the select.
      if (import.meta.env.DEV) {
        console.warn('[SbCrudForm] Form config unavailable:', fetchError);
      }
      setProbeFailed(true);
    }
  };

  const submitModal = async (payload: Record<string, unknown>) => {
    if (!modalConfig) {
      return;
    }

    setSubmitting(true);
    setSubmitError(undefined);
    setModalErrors({});

    try {
      const response = await crudApi.create(modalConfig.namespace, payload);
      const entry = (response?.entry ?? {}) as Record<string, unknown>;
      const option = entryToOption(entry, modalConfig);

      setCreatedEntries((current) => [...current, option]);
      onChange(option.value, entry);
      toast.success(response?.message ?? t('A new entry has been successfully created.'));
      setModalOpen(false);
    } catch (submitFailure) {
      const serverErrors = extractValidationErrors(submitFailure);
      if (Object.keys(serverErrors).length > 0) {
        const { error: generalError, ...fieldErrors } = serverErrors;
        setModalErrors(fieldErrors);
        setSubmitError(generalError);
      } else {
        toast.error(getApiErrorMessage(submitFailure, t('Unable to create the entry.')));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Select
          value={selectValue === '' ? undefined : selectValue}
          onValueChange={(next) => {
            const match = options.find((option) => String(option.value) === next);
            onChange(match ? match.value : next);
          }}
          disabled={disabled}
        >
          <SelectTrigger id={id} className="w-full" aria-invalid={Boolean(error)}>
            <SelectValue placeholder={selectedOption?.label ?? t('Select an option')} />
          </SelectTrigger>
          <SelectContent>
            {options
              .filter((option) => String(option.value) !== '')
              .map((option) => (
                <SelectItem key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
                  {option.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {error ? <p className="text-destructive mt-1 text-sm">{error}</p> : null}
      </div>

      {showTrigger && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label={`${t('Create new')} ${field.label ?? ''}`.trim()}
          title={t('Create new')}
          onClick={() => void openModal()}
        >
          <Plus className="size-4" />
        </Button>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalConfig?.title ?? field.label}</DialogTitle>
            {modalConfig?.description ? <DialogDescription>{modalConfig.description}</DialogDescription> : null}
          </DialogHeader>

          {modalConfig && (
            <ConfigForm
              config={modalConfig}
              values={modalValues}
              onFieldChange={(key, nextValue) => setModalValues((current) => ({ ...current, [key]: nextValue }))}
              errors={modalErrors}
              submitError={submitError}
              onSubmit={(payload) => void submitModal(payload)}
              submitting={submitting}
              showFooter={false}
              idPrefix="sb-crud-form"
              formId="sb-crud-form-modal"
            />
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => document.getElementById('sb-crud-form-modal')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
            >
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

registerCustomComponent('sbCrudForm', SbCrudForm);
registerCustomComponent('sbCreateCoupons', SbCrudForm);

export default SbCrudForm;
