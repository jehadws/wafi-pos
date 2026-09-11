import FormField from '@/components/forms/shared/form-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/lib/i18n';
import { CreditCard, Home } from 'lucide-react';
import React from 'react';
import type { UserProfileFormData } from './types';

interface ProfileAddressTabProps {
  type: 'shipping' | 'billing';
  form: {
    data: UserProfileFormData;
    errors: Partial<Record<keyof UserProfileFormData, string>>;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function ProfileAddressTab({ type, form, handleInputChange }: ProfileAddressTabProps) {
  const { t } = useTranslation();
  const isShipping = type === 'shipping';
  const title = isShipping ? t('Shipping Information') : t('Billing Information');
  const description = isShipping ? t('Manage your shipping details') : t('Manage your Billing details');
  const Icon = isShipping ? Home : CreditCard;

  const getFieldName = (field: string) => `${type}_${field}` as keyof UserProfileFormData;

  return (
    <div className="space-y-6 pt-4 focus:outline-none">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Icon className="text-primary h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              label={t('First Name')}
              htmlFor={getFieldName('first_name')}
              description={isShipping ? t('Provide the shipping first name.') : t('Provide the billing first name.')}
              error={form.errors?.[getFieldName('first_name')]}
            >
              <Input
                id={getFieldName('first_name')}
                name={getFieldName('first_name')}
                value={(form.data[getFieldName('first_name')] as string) || ''}
                onChange={handleInputChange}
                className={form.errors?.[getFieldName('first_name')] ? 'border-red-500' : ''}
              />
            </FormField>

            <FormField
              label={t('Last Name')}
              htmlFor={getFieldName('last_name')}
              description={isShipping ? t('Provide the shipping last name.') : t('Provide the billing last name.')}
              error={form.errors?.[getFieldName('last_name')]}
            >
              <Input
                id={getFieldName('last_name')}
                name={getFieldName('last_name')}
                value={(form.data[getFieldName('last_name')] as string) || ''}
                onChange={handleInputChange}
                className={form.errors?.[getFieldName('last_name')] ? 'border-red-500' : ''}
              />
            </FormField>

            <FormField
              label={t('Phone')}
              htmlFor={getFieldName('phone')}
              description={isShipping ? t('Shipping contact number.') : t('Billing contact number.')}
              error={form.errors?.[getFieldName('phone')]}
            >
              <Input
                id={getFieldName('phone')}
                name={getFieldName('phone')}
                value={(form.data[getFieldName('phone')] as string) || ''}
                onChange={handleInputChange}
                className={form.errors?.[getFieldName('phone')] ? 'border-red-500' : ''}
              />
            </FormField>
          </div>

          <Separator />

          {/* Address Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              label={t('Address Line 1')}
              htmlFor={getFieldName('address_1')}
              description={t('Street address, P.O. box, company name')}
              error={form.errors?.[getFieldName('address_1')]}
            >
              <Input
                id={getFieldName('address_1')}
                name={getFieldName('address_1')}
                value={(form.data[getFieldName('address_1')] as string) || ''}
                onChange={handleInputChange}
                className={form.errors?.[getFieldName('address_1')] ? 'border-red-500' : ''}
              />
            </FormField>

            <FormField
              label={t('Address Line 2')}
              htmlFor={getFieldName('address_2')}
              description={t('Apartment, suite, unit, building, floor, etc.')}
              error={form.errors?.[getFieldName('address_2')]}
            >
              <Input
                id={getFieldName('address_2')}
                name={getFieldName('address_2')}
                value={(form.data[getFieldName('address_2')] as string) || ''}
                onChange={handleInputChange}
                className={form.errors?.[getFieldName('address_2')] ? 'border-red-500' : ''}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              label={t('Country')}
              htmlFor={getFieldName('country')}
              description={isShipping ? t('Shipping country') : t('Billing country')}
              error={form.errors?.[getFieldName('country')]}
            >
              <Input
                id={getFieldName('country')}
                name={getFieldName('country')}
                value={(form.data[getFieldName('country')] as string) || ''}
                onChange={handleInputChange}
                className={form.errors?.[getFieldName('country')] ? 'border-red-500' : ''}
              />
            </FormField>

            <FormField label={t('City')} htmlFor={getFieldName('city')} description={t('City or town')} error={form.errors?.[getFieldName('city')]}>
              <Input
                id={getFieldName('city')}
                name={getFieldName('city')}
                value={(form.data[getFieldName('city')] as string) || ''}
                onChange={handleInputChange}
                className={form.errors?.[getFieldName('city')] ? 'border-red-500' : ''}
              />
            </FormField>

            <FormField
              label={t('PO Box')}
              htmlFor={getFieldName('pobox')}
              description={t('Postal Address')}
              error={form.errors?.[getFieldName('pobox')]}
            >
              <Input
                id={getFieldName('pobox')}
                name={getFieldName('pobox')}
                value={(form.data[getFieldName('pobox')] as string) || ''}
                onChange={handleInputChange}
                className={form.errors?.[getFieldName('pobox')] ? 'border-red-500' : ''}
              />
            </FormField>
          </div>

          <FormField
            label={t('Email')}
            htmlFor={getFieldName('email')}
            description={isShipping ? t('Shipping email address') : t('Billing email address')}
            error={form.errors?.[getFieldName('email')]}
          >
            <Input
              id={getFieldName('email')}
              name={getFieldName('email')}
              value={(form.data[getFieldName('email')] as string) || ''}
              onChange={handleInputChange}
              className={form.errors?.[getFieldName('email')] ? 'border-red-500' : ''}
            />
          </FormField>
        </CardContent>
      </Card>
    </div>
  );
}
