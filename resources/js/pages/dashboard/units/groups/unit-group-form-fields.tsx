import FormField from '@/components/forms/shared/form-field';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n';
import type { UnitGroupFormData } from './use-unit-group-form';

interface UnitGroupFormFieldsProps {
  form: {
    data: UnitGroupFormData;
    errors: Partial<Record<keyof UnitGroupFormData, string>>;
  };
  handleInputChange: (name: keyof UnitGroupFormData, value: string) => void;
}

export function UnitGroupFormFields({ form, handleInputChange }: UnitGroupFormFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FormField label={t('Description')} htmlFor="description" error={form.errors?.description}>
        <Textarea
          id="description"
          name="description"
          value={form.data.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
        />
      </FormField>
    </div>
  );
}
