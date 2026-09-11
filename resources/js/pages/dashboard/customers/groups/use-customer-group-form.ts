import { customersApi } from '@/api';
import { useTranslation } from '@/lib/i18n';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface CustomerGroupFormData {
  name: string;
  reward_system_id: string | number;
  minimal_credit_payment: string | number;
  description: string;
}

export type CustomerGroupFormMode = 'create' | 'edit';

export function useCustomerGroupForm(mode: CustomerGroupFormMode, group?: any) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerGroupFormData>(
    mode === 'edit' && group
      ? {
          name: group.name ?? '',
          reward_system_id: group.reward_system_id ?? '',
          minimal_credit_payment: group.minimal_credit_payment ?? '',
          description: group.description ?? '',
        }
      : {
          name: '',
          reward_system_id: '',
          minimal_credit_payment: '',
          description: '',
        },
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    form.setData({ ...form.data, [name]: value });
    if ((form.errors as any)[name]) form.clearErrors(name as any);
  };

  const handleSelectChange = (name: keyof CustomerGroupFormData, value: string | number) => {
    form.setData({ ...form.data, [name]: value });
    if ((form.errors as any)[name]) form.clearErrors(name as any);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    form.clearErrors();
    if (!form.data.name?.trim()) {
      form.setError('name', t('Name is required'));
      isValid = false;
    }
    return isValid;
  };

  const buildTransform = () => ({
    name: form.data.name,
    general: {
      reward_system_id: form.data.reward_system_id,
      minimal_credit_payment: form.data.minimal_credit_payment,
      description: form.data.description,
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
      if (mode === 'edit' && group) {
        const res = await customersApi.updateGroup(group.id, buildTransform());
        toast.success(t('Successfully saved'));
        if (res?.redirect) router.visit(res.redirect);
      } else {
        const res = await customersApi.createGroup(buildTransform());
        toast.success(t('Customer group created successfully'));
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
