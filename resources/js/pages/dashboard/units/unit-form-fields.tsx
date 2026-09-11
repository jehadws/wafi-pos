import { SbCrudForm } from '@/components/forms/config-form/sb-crud-form';
import FormField from '@/components/forms/shared/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { FormFieldDef } from '@/types/forms';
import type { UnitFormData } from './use-unit-form';

interface UnitFormFieldsProps {
  form: {
    data: UnitFormData;
    errors: Partial<Record<keyof UnitFormData, string>>;
  };
  unitGroups: { name: string; id: number }[];
  handleInputChange: (name: keyof UnitFormData, value: string | number | number[]) => void;
}

export function UnitFormFields({ form, unitGroups, handleInputChange }: UnitFormFieldsProps) {
  const { t } = useTranslation();

  const groupField: FormFieldDef = {
    name: 'group_id',
    label: t('Group'),
    type: 'search-select',
    component: 'sbCrudForm',
    namespace: 'sb.units-groups',
    validation: 'required',
    options: unitGroups.map((group) => ({ label: group.name, value: group.id })),
    description: t('Define to which group the unit should be assigned.'),
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <FormField
        label={t('Identifier')}
        error={form.errors.identifier}
        description={t('Should be a unique value with no spaces or special character')}
      >
        <Input
          id="identifier"
          name="identifier"
          value={form.data.identifier || ''}
          onChange={(e) => handleInputChange('identifier', e.target.value)}
          className={cn(form.errors.identifier && 'border-destructive')}
        />
      </FormField>

      <FormField label={t('Preview URL')} error={form.errors.preview_url} description={t('Preview of the unit.')}>
        <Input
          id="preview_url"
          name="preview_url"
          value={form.data.preview_url || ''}
          onChange={(e) => handleInputChange('preview_url', e.target.value)}
          className={cn(form.errors.preview_url && 'border-destructive')}
        />
      </FormField>

      <FormField label={t('Value')} error={form.errors.value} description={t('Define the value of the unit.')} required>
        <Input
          id="value"
          name="value"
          value={form.data.value || ''}
          onChange={(e) => handleInputChange('value', e.target.value)}
          className={cn(form.errors.value && 'border-destructive')}
        />
      </FormField>

      <FormField label={t('Group')} error={form.errors.group_id} description={t('Define to which group the unit should be assigned.')} required>
        <SbCrudForm
          field={groupField}
          value={form.data.group_id}
          onChange={(value) => handleInputChange('group_id', value as number)}
          error={form.errors.group_id}
        />
      </FormField>

      <FormField
        label={t('Base Unit')}
        error={form.errors.base_unit ? String(form.errors.base_unit) : undefined}
        description={t('Determine if the unit is the base unit from the group.')}
        required
      >
        <RadioGroup
          defaultValue={form.data.base_unit.toString()}
          value={form.data.base_unit === 1 ? '1' : '0'}
          onValueChange={(value) => handleInputChange('base_unit', +value)}
          className="flex gap-6 py-3"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value={`1`} id="yes" />
            <Label htmlFor="yes" className="cursor-pointer">
              {t('Yes')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value={`0`} id="no" />
            <Label htmlFor="no" className="cursor-pointer">
              {t('No')}
            </Label>
          </div>
        </RadioGroup>
      </FormField>

      <FormField label={t('Description')} error={form.errors.description} description={t('Provide a short description about the unit.')}>
        <Textarea
          id="description"
          name="description"
          placeholder={t('Describe your property in detail...')}
          rows={5}
          value={form.data.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className={cn(form.errors.description && 'border-destructive')}
        />
      </FormField>
    </div>
  );
}
