import { taxesApi } from '@/api';
import { useTranslation } from '@/lib/i18n';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface TaxFormData {
  name: string;
  description: string;
  tax_group_id: string | number;
  rate: string | number;
}

export type TaxFormMode = 'create' | 'edit';

export function useTaxForm(mode: TaxFormMode, tax?: any) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaxFormData>(
    mode === 'edit' && tax
      ? {
          name: tax.name ?? '',
          description: tax.description ?? '',
          tax_group_id: tax.tax_group_id ?? '',
          rate: tax.rate ?? '',
        }
      : {
          name: '',
          description: '',
          tax_group_id: '',
          rate: '',
        },
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    form.setData({ ...form.data, [name]: value });
    if (form.errors[name as keyof typeof form.data]) form.clearErrors(name as keyof typeof form.data);
  };

  const handleSelectChange = (name: keyof TaxFormData, value: string | number) => {
    form.setData({ ...form.data, [name]: value });
    if (form.errors[name as keyof typeof form.data]) form.clearErrors(name as keyof typeof form.data);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    form.clearErrors();

    if (!form.data.name.trim()) {
      form.setError('name', t('Tax name is required'));
      isValid = false;
    }
    if (!String(form.data.rate).trim()) {
      form.setError('rate', t('Rate is required'));
      isValid = false;
    }
    if (!form.data.tax_group_id) {
      form.setError('tax_group_id', t('Tax group is required'));
      isValid = false;
    }

    return isValid;
  };

  const buildTransform = () => ({
    name: form.data.name,
    general: {
      description: form.data.description,
      tax_group_id: form.data.tax_group_id,
      rate: form.data.rate,
    },
  });

  const onError = () => {
    toast.error(t('Please fix the validation errors'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && tax) {
        const res = await taxesApi.update(tax.id, buildTransform());
        toast.success(t('Successfully saved'));
        if (res?.redirect) router.visit(res.redirect);
      } else {
        const res = await taxesApi.create(buildTransform());
        toast.success(t('Tax created successfully'));
        if (res?.redirect) router.visit(res.redirect);
      }
    } catch {
      onError();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form: { ...form, processing: isSubmitting || form.processing },
    handleSubmit,
    handleInputChange,
    handleSelectChange,
  };
}
