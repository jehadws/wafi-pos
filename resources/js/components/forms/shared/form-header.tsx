'use client';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { InertiaFormProps } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface FormHeaderProps {
  title: string;
  description?: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  showReturn?: boolean;
  form: InertiaFormProps<any>;
}

export default function FormHeader({ title, description, onCancel, onSave, saveLabel = 'Save', showReturn = true, form }: FormHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="border-b">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          {showReturn && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {description && <p className="text-muted-foreground text-sm">{description}</p>}
          </div>
        </div>
        <Button onClick={onSave} disabled={form.processing || form.hasErrors} type="submit">
          {saveLabel === 'Save' ? t('Save') : saveLabel}
        </Button>
      </div>
    </div>
  );
}
