import { taxesApi } from '@/api';
import { useTranslation } from '@/lib/i18n';
import { extractValidationErrors } from '@/utils/api-errors';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface TaxGroupFormData {
  name: string;
  description: string;
}

export type TaxGroupFormMode = 'create' | 'edit';

export function useTaxGroupForm(mode: TaxGroupFormMode, group?: any) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaxGroupFormData>(
    mode === 'edit' && group
      ? {
          name: group.name ?? '',
          description: group.description ?? '',
        }
      : {
          name: '',
          description: '',
        },
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    form.setData({ ...form.data, [name]: value });
    // @ts-expect-error Inertia form type
    if (form.errors[name]) form.clearErrors(name);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    form.clearErrors();
    if (!form.data.name.trim()) {
      form.setError('name', t('Tax group name is required'));
      isValid = false;
    }
    return isValid;
  };

  const buildTransform = () => ({
    name: form.data.name,
    general: {
      description: form.data.description,
    },
  });

  const onError = (errors: Record<string, string>) => {
    console.error('Validation errors:', errors);
    toast.error(t('Please fix the validation errors'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && group) {
        const res = await taxesApi.updateGroup(group.id, buildTransform());
        toast.success(t('Successfully saved'));
        if (res?.redirect) router.visit(res.redirect);
      } else {
        const res = await taxesApi.createGroup(buildTransform());
        toast.success(t('Successfully saved'));
        if (res?.redirect) router.visit(res.redirect);
      }
    } catch (err) {
      onError(extractValidationErrors(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form: { ...form, processing: isSubmitting || form.processing },
    handleSubmit,
    handleInputChange,
  };
}
