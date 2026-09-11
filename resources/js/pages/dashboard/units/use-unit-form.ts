/**
 * pages/dashboard/units/use-unit-form.ts
 * Shared hook for units create & edit.
 */
import { unitsApi } from '@/api';
import { useTranslation } from '@/lib/i18n';
import { extractValidationErrors } from '@/utils/api-errors';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface UnitFormData {
  name: string;
  description: string;
  group_id: string | number;
  value: string | number;
  base_unit: number;
  identifier: string;
  preview_url: string;
}

export type UnitFormMode = 'create' | 'edit';

export function useUnitForm(mode: UnitFormMode, unit?: any) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UnitFormData>(
    mode === 'edit' && unit
      ? {
          name: unit.name ?? '',
          description: unit.description ?? '',
          group_id: unit.group_id ?? '',
          value: unit.value ?? '',
          base_unit: unit.base_unit ? 1 : 0,
          identifier: unit.identifier ?? '',
          preview_url: unit.preview_url ?? '',
        }
      : { name: '', description: '', group_id: '', value: '', base_unit: 0, identifier: '', preview_url: '' },
  );

  const handleInputChange = (name: keyof UnitFormData, value: string | number | number[]) => {
    form.setData({ ...form.data, [name]: value });
    if (form.errors[name]) form.clearErrors(name);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    form.clearErrors();
    if (!form.data.name.trim()) {
      form.setError('name', t('Name is required'));
      isValid = false;
    }
    if (!form.data.group_id) {
      form.setError('group_id', t('Group is required'));
      isValid = false;
    }
    if (!form.data.value) {
      form.setError('value', t('Value is required'));
      isValid = false;
    }
    return isValid;
  };

  const buildTransform = () => ({
    name: form.data.name,
    general: {
      identifier: form.data.identifier,
      preview_url: form.data.preview_url,
      value: form.data.value,
      group_id: +form.data.group_id,
      base_unit: +form.data.base_unit,
      description: form.data.description,
    },
  });

  const onError = (errors: Record<string, string>) => {
    if (errors.error) toast.error(errors.error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && unit) {
        const res = await unitsApi.update(unit.id, buildTransform());
        toast.info(t('The entry has been successfully updated.'));
        if (res?.redirect) router.visit(res.redirect);
      } else {
        const res = await unitsApi.create(buildTransform());
        toast.info(t('The Unit has been created.'));
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
