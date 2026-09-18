import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { registerCustomComponent, type CustomFieldComponentProps } from './registry';

export function CodeGeneratorField({ field, value, onChange, disabled, error, id }: CustomFieldComponentProps) {
  const { t } = useTranslation();

  const handleGenerate = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    onChange(code);
    toast.info(t('Generated code: {{code}}', { code }));
  };

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        name={field.name}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder={typeof field.placeholder === 'string' ? field.placeholder : t('e.g., SUMMER20')}
        className={cn(error && 'border-destructive', 'uppercase')}
        disabled={disabled}
      />
      <Button type="button" variant="outline" onClick={handleGenerate} disabled={disabled}>
        {t('Generate')}
      </Button>
    </div>
  );
}

// Register under explicit component identifiers only — never field
// names (audit #13: a generic key like 'code' would silently grow a
// Generate button with a Math.random() code on any future field named
// `code` in any Crud; the coupon code field declares 'codeGenerator'
// explicitly from the backend instead).
registerCustomComponent('couponCodeGenerator', CodeGeneratorField);
registerCustomComponent('codeGenerator', CodeGeneratorField);
