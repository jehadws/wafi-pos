import FormField from '@/components/forms/shared/form-field';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/lib/i18n';
import type { InertiaFormProps } from '@inertiajs/react';
import { ShoppingBag, Sparkles, Truck } from 'lucide-react';
import type { ResetSettingsOptions, ResetSettingsPayload } from './types';

interface ResetFormProps {
  form: InertiaFormProps<ResetSettingsPayload>;
  options: ResetSettingsOptions;
  disabled?: boolean;
}

export function ResetForm({ form, options, disabled = false }: ResetFormProps) {
  const { t } = useTranslation();
  const isDemoMode = form.data.mode === 'wipe_plus_grocery';

  return (
    <div className="space-y-6">
      <FormField label={t('Reset Mode')} description={t('Select the target state for your database reset.')} required>
        <Select value={form.data.mode} onValueChange={(val) => form.setData('mode', val)} disabled={disabled}>
          <SelectTrigger className="w-full max-w-lg">
            <SelectValue placeholder={t('Select reset mode')} />
          </SelectTrigger>
          <SelectContent>
            {(options.modes || []).map((mode) => (
              <SelectItem key={mode.value} value={mode.value}>
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {isDemoMode && (
        <div className="max-w-2xl space-y-4 border-t pt-2">
          <div className="text-foreground flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>{t('Demo Dataset Options')}</span>
          </div>

          <div className="space-y-3">
            <div className="bg-card/50 flex items-center justify-between rounded-lg border p-3.5">
              <div className="space-y-0.5 pe-4">
                <Label htmlFor="create-procurements" className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <Truck className="text-primary h-4 w-4" />
                  {t('Generate Sample Procurements')}
                </Label>
                <p className="text-muted-foreground text-xs">
                  {t('Creates sample supplier purchase orders and stock receipts to stock up products.')}
                </p>
              </div>
              <Switch
                id="create-procurements"
                checked={form.data.create_procurements}
                onCheckedChange={(checked) => {
                  form.setData((prev) => ({
                    ...prev,
                    create_procurements: checked,
                    // Sales require procurements, so turn off sales if procurements is turned off
                    create_sales: checked ? prev.create_sales : false,
                  }));
                }}
                disabled={disabled}
              />
            </div>

            <div className="bg-card/50 flex items-center justify-between rounded-lg border p-3.5">
              <div className="space-y-0.5 pe-4">
                <Label htmlFor="create-sales" className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <ShoppingBag className="text-primary h-4 w-4" />
                  {t('Generate Sample Sales (Orders)')}
                </Label>
                <p className="text-muted-foreground text-xs">{t('Creates sample POS orders, payment entries and customer transactions.')}</p>
              </div>
              <Switch
                id="create-sales"
                checked={form.data.create_sales}
                onCheckedChange={(checked) => form.setData('create_sales', checked)}
                disabled={disabled || !form.data.create_procurements}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
