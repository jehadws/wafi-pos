import FormField from '@/components/forms/shared/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
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
    </div>
  );
}
