/**
 * pages/dashboard/customers/customer-form-fields.tsx
 *
 * Pure presentation — all customer form tabs (General / Billing / Shipping).
 */

import { SbCrudForm } from '@/components/forms/config-form/sb-crud-form';
import FormField from '@/components/forms/shared/form-field';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import type { FormFieldDef } from '@/types/forms';
import React from 'react';
import type { CustomerFormData } from './use-customer-form';

interface CustomerFormFieldsProps {
  form: {
    data: CustomerFormData;
    errors: Partial<Record<keyof CustomerFormData, string>>;
  };
  groups: { id: number; name: string }[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string | number) => void;
}

function AddressFields({
  prefix,
  data,
  errors,
  handleInputChange,
  descriptions,
}: {
  prefix: 'billing' | 'shipping';
  data: CustomerFormData;
  errors: Partial<Record<keyof CustomerFormData, string>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  descriptions: Record<string, string>;
}) {
  const { t } = useTranslation();
  const fields: Array<{ key: string; label: string; type?: string }> = [
    { key: 'first_name', label: t('First Name') },
    { key: 'last_name', label: t('Last Name') },
    { key: 'phone', label: t('Phone'), type: 'tel' },
    { key: 'address_1', label: t('Address 1') },
    { key: 'address_2', label: t('Address 2') },
    { key: 'country', label: t('Country') },
    { key: 'city', label: t('City') },
    { key: 'pobox', label: t('PO Box') },
    { key: 'company', label: t('Company') },
    { key: 'email', label: t('Email') },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {fields.map(({ key, label, type }) => {
        const fieldKey = `${prefix}_${key}` as keyof CustomerFormData;
        return (
          <FormField key={fieldKey} label={label} htmlFor={fieldKey} description={descriptions[key] ?? label} error={errors[fieldKey]}>
            <Input
              id={fieldKey}
              name={fieldKey}
              value={(data[fieldKey] as string) ?? ''}
              onChange={handleInputChange}
              type={type}
              className={errors[fieldKey] ? 'border-red-500' : ''}
            />
          </FormField>
        );
      })}
    </div>
  );
}

export function CustomerFormFields({ form, groups, handleInputChange, handleSelectChange }: CustomerFormFieldsProps) {
  const { t } = useTranslation();

  const groupField: FormFieldDef = {
    name: 'group_id',
    label: t('Group'),
    type: 'search-select',
    component: 'sbCrudForm',
    namespace: 'sb.customers-groups',
    validation: 'required',
    options: groups.map((group) => ({ label: group.name, value: group.id })),
    description: t('Assign the customer to a group.'),
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">{t('General')}</TabsTrigger>
        <TabsTrigger value="billing_address">{t('Billing Address')}</TabsTrigger>
        <TabsTrigger value="shipping_address">{t('Shipping Address')}</TabsTrigger>
      </TabsList>

      {/* ── General Tab ── */}
      <TabsContent value="general" className="mt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            label={t('Last Name')}
            htmlFor="general_last_name"
            description={t('Provide the customer last name')}
            error={form.errors?.general_last_name}
          >
            <Input
              id="general_last_name"
              name="general_last_name"
              value={form.data.general_last_name}
              onChange={handleInputChange}
              className={form.errors?.general_last_name ? 'border-red-500' : ''}
            />
          </FormField>

          <FormField
            label={t('Credit Limit')}
            htmlFor="general_credit_limit_amount"
            description={t('Set what should be the limit of the purchase on credit.')}
            error={form.errors?.general_credit_limit_amount}
          >
            <Input
              id="general_credit_limit_amount"
              name="general_credit_limit_amount"
              value={form.data.general_credit_limit_amount as string}
              onChange={handleInputChange}
              type="number"
              className={form.errors?.general_credit_limit_amount ? 'border-red-500' : ''}
            />
          </FormField>

          <FormField
            label={t('Group')}
            htmlFor="general_group_id"
            description={t('Assign the customer to a group.')}
            error={form.errors.general_group_id}
            required
          >
            <SbCrudForm
              field={groupField}
              value={form.data.general_group_id}
              onChange={(value) => handleSelectChange('general_group_id', value as number)}
              error={form.errors.general_group_id}
              id="general_group_id"
            />
          </FormField>

          <FormField
            label={t('Birth Date')}
            htmlFor="general_birth_date"
            description={t('Displays the customer birth date.')}
            error={form.errors?.general_birth_date}
          >
            <DatePicker onDateChange={(value) => handleSelectChange('general_birth_date', value as any)} date={form.data.general_birth_date as any} />
          </FormField>

          <FormField label={t('Email')} htmlFor="general_email" description={t('Provide the customer email.')} error={form.errors?.general_email}>
            <Input
              id="general_email"
              name="general_email"
              value={form.data.general_email}
              onChange={handleInputChange}
              className={form.errors?.general_email ? 'border-red-500' : ''}
            />
          </FormField>

          <FormField
            label={t('Phone')}
            htmlFor="general_phone"
            description={t('Provide the customer phone number')}
            error={form.errors?.general_phone}
          >
            <Input
              id="general_phone"
              name="general_phone"
              value={form.data.general_phone}
              onChange={handleInputChange}
              type="tel"
              className={form.errors?.general_phone ? 'border-red-500' : ''}
            />
          </FormField>

          <FormField label={t('PO Box')} htmlFor="general_pobox" description={t('Provide the customer PO.Box')} error={form.errors?.general_pobox}>
            <Input
              id="general_pobox"
              name="general_pobox"
              value={form.data.general_pobox}
              onChange={handleInputChange}
              className={form.errors?.general_pobox ? 'border-red-500' : ''}
            />
          </FormField>

          <FormField label={t('Gender')} htmlFor="general_gender" description={t('Provide the customer gender.')} error={form.errors?.general_gender}>
            <Select value={form.data.general_gender} onValueChange={(value) => handleSelectChange('general_gender', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('Not Defined')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t('Male')}</SelectItem>
                <SelectItem value="female">{t('Female')}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </TabsContent>

      {/* ── Billing ── */}
      <TabsContent value="billing_address" className="mt-6">
        <AddressFields
          prefix="billing"
          data={form.data}
          errors={form.errors}
          handleInputChange={handleInputChange}
          descriptions={{
            first_name: t('Billing First Name'),
            last_name: t('Billing Last Name'),
            phone: t('Billing phone number.'),
            address_1: t('Billing First Address.'),
            address_2: t('Billing Second Address.'),
            country: t('Billing Country.'),
            city: t('Billing City'),
            pobox: t('Postal Address'),
            company: t('Company'),
            email: t('Billing Email'),
          }}
        />
      </TabsContent>

      {/* ── Shipping ── */}
      <TabsContent value="shipping_address" className="mt-6">
        <AddressFields
          prefix="shipping"
          data={form.data}
          errors={form.errors}
          handleInputChange={handleInputChange}
          descriptions={{
            first_name: t('Shipping First Name'),
            last_name: t('Shipping Last Name'),
            phone: t('Shipping phone number.'),
            address_1: t('Shipping First Address.'),
            address_2: t('Shipping Second Address.'),
            country: t('Shipping Country.'),
            city: t('Shipping City'),
            pobox: t('Postal Address'),
            company: t('Company'),
            email: t('Shipping Email'),
          }}
        />
      </TabsContent>
    </Tabs>
  );
}
