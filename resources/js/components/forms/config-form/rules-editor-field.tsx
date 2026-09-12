import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { Plus, X } from 'lucide-react';
import { registerCustomComponent, type CustomFieldComponentProps } from './registry';

export interface RewardRule {
  id?: number | string;
  _clientId?: string;
  from: number | string;
  to: number | string;
  reward: number | string;
}

export function RulesEditorField({ value, onChange, disabled, error }: CustomFieldComponentProps) {
  const { t } = useTranslation();
  const rules: RewardRule[] = Array.isArray(value) ? (value as RewardRule[]) : [];

  const addRule = () => {
    const newRule: RewardRule = {
      _clientId: `rule-${Date.now()}-${Math.random()}`,
      from: '',
      to: '',
      reward: '',
    };
    onChange([...rules, newRule]);
  };

  const removeRule = (indexToRemove: number) => {
    onChange(rules.filter((_, idx) => idx !== indexToRemove));
  };

  const updateRule = (indexToUpdate: number, field: keyof Omit<RewardRule, 'id' | '_clientId'>, val: string) => {
    onChange(rules.map((rule, idx) => (idx === indexToUpdate ? { ...rule, [field]: val } : rule)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{t('Reward Rules')}</h3>
          <p className="text-muted-foreground text-xs">{t('Configure point rewards for target ranges.')}</p>
        </div>
        <Button type="button" size="sm" onClick={addRule} disabled={disabled}>
          <Plus className="me-1 h-4 w-4" />
          {t('Add Rule')}
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rules.map((rule, index) => (
          <Card key={rule.id ?? rule._clientId ?? index} className="relative">
            <CardContent className="p-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 absolute end-2 top-2 h-7 w-7"
                onClick={() => removeRule(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex flex-col gap-3 pt-2">
                <FormField label={t('From')} description={t('The interval start here.')}>
                  <Input
                    type="number"
                    placeholder={t('e.g., 200')}
                    value={rule.from ?? ''}
                    onChange={(e) => updateRule(index, 'from', e.target.value)}
                    disabled={disabled}
                  />
                </FormField>

                <FormField label={t('To')} description={t('The interval ends here.')}>
                  <Input
                    type="number"
                    placeholder={t('e.g., 400')}
                    value={rule.to ?? ''}
                    onChange={(e) => updateRule(index, 'to', e.target.value)}
                    disabled={disabled}
                  />
                </FormField>

                <FormField label={t('Points')} description={t('Points earned.')}>
                  <Input
                    type="number"
                    placeholder={t('e.g., 200')}
                    value={rule.reward ?? ''}
                    onChange={(e) => updateRule(index, 'reward', e.target.value)}
                    disabled={disabled}
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

registerCustomComponent('rules', RulesEditorField);
registerCustomComponent('rulesEditor', RulesEditorField);
