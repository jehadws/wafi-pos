/**
 * pages/dashboard/customers/use-customer-form.ts
 *
 * Shared hook for customers create & edit.
 */

import { customersApi } from '@/api';
import { useTranslation } from '@/lib/i18n';
import { extractValidationErrors } from '@/utils/api-errors';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface CustomerFormData {
  first_name: string;
  general_last_name: string;
  general_credit_limit_amount: string | number;
  general_group_id: string | number;
  general_birth_date: string;
  general_email: string;
  general_phone: string;
  general_pobox: string;
  general_gender: string;
  billing_first_name: string;
  billing_last_name: string;
  billing_phone: string;
  billing_address_1: string;
  billing_address_2: string;
  billing_country: string;
  billing_city: string;
  billing_pobox: string;
  billing_company: string;
  billing_email: string;
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_phone: string;
  shipping_address_1: string;
  shipping_address_2: string;
  shipping_country: string;
  shipping_city: string;
  shipping_pobox: string;
  shipping_company: string;
  shipping_email: string;
}

export type CustomerFormMode = 'create' | 'edit';

const emptyDefaults = (): CustomerFormData => ({
  first_name: '',
  general_last_name: '',
  general_credit_limit_amount: '',
  general_group_id: '',
  general_birth_date: '',
  general_email: '',
  general_phone: '',
  general_pobox: '',
  general_gender: '',
  billing_first_name: '',
  billing_last_name: '',
  billing_phone: '',
  billing_address_1: '',
  billing_address_2: '',
  billing_country: '',
  billing_city: '',
  billing_pobox: '',
  billing_company: '',
  billing_email: '',
  shipping_first_name: '',
  shipping_last_name: '',
  shipping_phone: '',
  shipping_address_1: '',
  shipping_address_2: '',
  shipping_country: '',
  shipping_city: '',
  shipping_pobox: '',
  shipping_company: '',
  shipping_email: '',
});

const editDefaults = (customer: any): CustomerFormData => ({
  first_name: customer.first_name ?? '',
  general_last_name: customer.last_name ?? '',
  general_credit_limit_amount: customer.credit_limit_amount ?? '',
  general_group_id: customer.group_id ?? '',
  general_birth_date: customer.birth_date ?? '',
  general_email: customer.email ?? '',
  general_phone: customer.phone ?? '',
  general_pobox: customer.pobox ?? '',
  general_gender: customer.gender ?? '',
  billing_first_name: customer.billing?.first_name ?? '',
  billing_last_name: customer.billing?.last_name ?? '',
  billing_phone: customer.billing?.phone ?? '',
  billing_address_1: customer.billing?.address_1 ?? '',
  billing_address_2: customer.billing?.address_2 ?? '',
  billing_country: customer.billing?.country ?? '',
  billing_city: customer.billing?.city ?? '',
  billing_pobox: customer.billing?.pobox ?? '',
  billing_company: customer.billing?.company ?? '',
  billing_email: customer.billing?.email ?? '',
  shipping_first_name: customer.shipping?.first_name ?? '',
  shipping_last_name: customer.shipping?.last_name ?? '',
  shipping_phone: customer.shipping?.phone ?? '',
  shipping_address_1: customer.shipping?.address_1 ?? '',
  shipping_address_2: customer.shipping?.address_2 ?? '',
  shipping_country: customer.shipping?.country ?? '',
  shipping_city: customer.shipping?.city ?? '',
  shipping_pobox: customer.shipping?.pobox ?? '',
  shipping_company: customer.shipping?.company ?? '',
  shipping_email: customer.shipping?.email ?? '',
});

const buildTransform = (data: CustomerFormData) => ({
  first_name: data.first_name,
  general: {
    last_name: data.general_last_name,
    credit_limit_amount: data.general_credit_limit_amount,
    group_id: data.general_group_id,
    birth_date: data.general_birth_date,
    email: data.general_email,
    phone: data.general_phone,
    pobox: data.general_pobox,
    gender: data.general_gender,
  },
  billing: {
    first_name: data.billing_first_name,
    last_name: data.billing_last_name,
    phone: data.billing_phone,
    address_1: data.billing_address_1,
    address_2: data.billing_address_2,
    country: data.billing_country,
    city: data.billing_city,
    pobox: data.billing_pobox,
    company: data.billing_company,
    email: data.billing_email,
  },
  shipping: {
    first_name: data.shipping_first_name,
    last_name: data.shipping_last_name,
    phone: data.shipping_phone,
    address_1: data.shipping_address_1,
    address_2: data.shipping_address_2,
    country: data.shipping_country,
    city: data.shipping_city,
    pobox: data.shipping_pobox,
    company: data.shipping_company,
    email: data.shipping_email,
  },
});

export function useCustomerForm(mode: CustomerFormMode, customer?: any) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerFormData>(mode === 'edit' && customer ? editDefaults(customer) : emptyDefaults());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    form.setData({ ...form.data, [name]: value } as CustomerFormData);
    // @ts-expect-error Inertia form type
    if (form.errors[name]) form.clearErrors(name as any);
  };

  const handleSelectChange = (name: string, value: string | number) => {
    form.setData({ ...form.data, [name]: value } as CustomerFormData);
    // @ts-expect-error Inertia form type
    if (form.errors[name]) form.clearErrors(name as any);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    form.clearErrors();

    if (!form.data.first_name.trim()) {
      form.setError('first_name', t('First name is required'));
      isValid = false;
    }
    if (!form.data.general_group_id) {
      form.setError('general_group_id', t('Group is required'));
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm() || isSubmitting) return;

    const onError = (errors: Record<string, string>) => {
      console.error('Validation errors:', errors);
      toast.error(t('The form is not valid. Please check it and try again'));
    };

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && customer) {
        const res = await customersApi.update(customer.id, buildTransform(form.data));
        toast.success(t('The customer has been updated.'));
        if (res?.redirect) router.visit(res.redirect);
      } else {
        const res = await customersApi.create(buildTransform(form.data));
        toast.success(t('The customer has been created.'));
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
    handleSelectChange,
  };
}
