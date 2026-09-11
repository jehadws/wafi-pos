import FormField from '@/components/forms/shared/form-field';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n';
import React from 'react';
import type { TaxGroupFormData } from './use-tax-group-form';

interface TaxGroupFormFieldsProps {
  form: {
    data: TaxGroupFormData;
    errors: Partial<Record<keyof TaxGroupFormData, string>>;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function TaxGroupFormFields({ form, handleInputChange }: TaxGroupFormFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FormField
          label={t('Description')}
          htmlFor="description"
          description={t('Provide a short description to the tax group.')}
          error={form.errors?.description}
        >
          <Textarea
            id="description"
            name="description"
            value={form.data.description}
            onChange={handleInputChange}
            placeholder={t('Enter Role description')}
            rows={4}
          />
        </FormField>
      </div>
    </div>
  );
}
