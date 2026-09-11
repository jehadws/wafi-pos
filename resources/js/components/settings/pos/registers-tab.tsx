import { SbCrudForm } from '@/components/forms/config-form/sb-crud-form';
import FormField from '@/components/forms/shared/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import type { FormFieldDef } from '@/types/forms';
import type { PosSettingsOptions, PosSettingsPayload } from './types';

interface RegistersTabProps {
  form: {
    data: PosSettingsPayload;
    setData: (field: string, value: any) => void;
  };
  options: PosSettingsOptions;
}

export function RegistersTab({ form, options }: RegistersTabProps) {
  const { t } = useTranslation();

  const changePaymentTypeField: FormFieldDef = {
    name: 'sb_subul_registers_default_change_payment_type',
    label: t('Default Change Payment Type'),
    type: 'search-select',
    component: 'sbCrudForm',
    namespace: 'sb.payments-types',
    validation: 'required',
    options: (options.sb_subul_registers_default_change_payment_type || []).map((pt) => ({
      label: pt.label,
      value: (pt.value ?? pt.id) as string | number,
    })),
    description: t('Define the payment type that will be used for all change from the registers.'),
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <FormField label={t('Enable Cash Registers')} description={t('Determine if the POS will support cash registers.')}>
        <Select
          value={form.data.registers.sb_subul_registers_enabled || ''}
          onValueChange={(v) => form.setData('registers.sb_subul_registers_enabled', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('Select an option')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="null" value="null">
              {t('Select an option')}
            </SelectItem>
            {options.sb_subul_registers_enabled.map((l) => (
              <SelectItem key={l.value} value={l.value.toString()}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {form.data.registers.sb_subul_registers_enabled === 'yes' && (
        <>
          <FormField label={t('Cashier Idle Counter')} description={t('Selected after how many minutes the system will set the cashier as idle.')}>
            <Select value={form.data.registers.sb_subul_idle_counter || ''} onValueChange={(v) => form.setData('registers.sb_subul_idle_counter', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('Select an option')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="null" value="null">
                  {t('Select an option')}
                </SelectItem>
                {(options.sb_subul_idle_counter || []).map((l) => (
                  <SelectItem key={l.value} value={l.value.toString()}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t('Cash Disbursement')} description={t('Allow cash disbursement by the cashier.')}>
            <Select value={form.data.registers.sb_subul_disbursement || ''} onValueChange={(v) => form.setData('registers.sb_subul_disbursement', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('Select an option')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="null" value="null">
                  {t('Select an option')}
                </SelectItem>
                {(options.sb_subul_disbursement || []).map((l) => (
                  <SelectItem key={l.value} value={l.value.toString()}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label={t('Default Change Payment Type')}
            description={t('Define the payment type that will be used for all change from the registers.')}
            required
          >
            <SbCrudForm
              field={changePaymentTypeField}
              value={form.data.registers.sb_subul_registers_default_change_payment_type ?? ''}
              onChange={(value) => form.setData('registers.sb_subul_registers_default_change_payment_type', value)}
            />
          </FormField>
        </>
      )}
    </div>
  );
}
