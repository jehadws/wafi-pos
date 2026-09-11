import FormField from '@/components/forms/shared/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { CategoryFormData } from './use-category-form';

interface CategoryFormFieldsProps {
  form: {
    data: CategoryFormData;
    errors: Partial<Record<keyof CategoryFormData, string>>;
  };
  categories: any[];
  handleInputChange: (name: keyof CategoryFormData, value: string | number | number[]) => void;
}

export function CategoryFormFields({ form, categories, handleInputChange }: CategoryFormFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <FormField label={t('Preview')} error={form.errors.preview_url} description={t('Provide a preview url to the category.')}>
        <Input
          id="preview_url"
          name="preview_url"
          value={form.data.preview_url || ''}
          onChange={(e) => handleInputChange('preview_url', e.target.value)}
          className={cn(form.errors.preview_url && 'border-destructive')}
        />
      </FormField>

      <FormField
        label={t('Displays On POS')}
        error={form.errors.displays_on_pos ? String(form.errors.displays_on_pos) : undefined}
        description={t('If this category should be a child category of an existing category.')}
      >
        <RadioGroup
          id="displays_on_pos"
          defaultValue={form.data.displays_on_pos.toString()}
          value={form.data.displays_on_pos.toString()}
          onValueChange={(value) => handleInputChange('displays_on_pos', +value)}
          className="flex h-10 gap-4"
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

      <FormField
        label={t('Parent')}
        error={form.errors.parent_id ? String(form.errors.parent_id) : undefined}
        description={t('If this category should be a child category of an existing category.')}
      >
        <Select value={form.data.parent_id.toString()} onValueChange={(value) => handleInputChange('parent_id', +value)}>
          <SelectTrigger className={cn(form.errors.parent_id && 'border-destructive')}>
            <SelectValue placeholder={t('Select Group')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key={`0`} value={'0'}>
              {t('No Parent')}
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={`${category.id}-${category.name}`} value={`${category.id}`}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label={t('Description')} error={form.errors.description} description={t('Provide a short description about the category.')}>
        <Textarea
          id="description"
          name="description"
          placeholder={t('Describe your category in detail...')}
          rows={5}
          value={form.data.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className={cn(form.errors.description && 'border-destructive')}
        />
      </FormField>
    </div>
  );
}
