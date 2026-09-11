/**
 * pages/dashboard/products/product-form-fields.tsx
 *
 * Pure presentation component — renders product name field and all 5 tabs.
 * Receives the form object and handlers as props.
 *
 * Shared by create.tsx and edit.tsx.
 */

import ExpiryTab from '@/components/forms/product-form/expiry-tab';
import GroupsTab from '@/components/forms/product-form/groups-tab';
import IdentificationTab from '@/components/forms/product-form/identification-tab';
import ImagesTab from '@/components/forms/product-form/images-tab';
import TaxesTab from '@/components/forms/product-form/taxes-tab';
import { ProductFormData } from '@/components/forms/product-form/types';
import UnitsTab from '@/components/forms/product-form/units-tab';
import FormField from '@/components/forms/shared/form-field';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { InertiaFormProps } from '@inertiajs/react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProductFormFieldsProps {
  form: InertiaFormProps<ProductFormData>;
  handleInputChange: (name: keyof ProductFormData, value: string | number | number[] | boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductFormFields({ form, handleInputChange }: ProductFormFieldsProps) {
  const { t } = useTranslation();

  /**
   * The backend groups tab only exists for grouped products
   * (`ProductCrud` groups `show` gate).
   */
  const isGrouped = form.data?.identification_type === 'grouped';

  return (
    <>
      {/* Product Name */}
      <FormField label={t('Name')} error={form.errors?.name} description={t('Provide a name to the resource.')} className="mb-6">
        <Input
          id="name"
          name="name"
          value={form.data?.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={cn(form.errors?.name && 'border-destructive')}
          placeholder={t('Enter product name')}
          required
        />
      </FormField>

      {/* Tabs */}
      <Tabs defaultValue="identification" className="w-full">
        <TabsList className={cn('grid w-full', isGrouped ? 'grid-cols-6' : 'grid-cols-5')}>
          <TabsTrigger value="identification" className={cn(form.errors?.identification_error ? 'text-destructive' : '')}>
            {t('Identification')}
          </TabsTrigger>
          {isGrouped && (
            <TabsTrigger value="groups" className={cn(form.errors?.groups_error ? 'text-destructive' : '')}>
              {t('Groups')}
            </TabsTrigger>
          )}
          <TabsTrigger value="units" className={cn(form.errors?.units_error ? 'text-destructive' : '')}>
            {t('Units')}
          </TabsTrigger>
          <TabsTrigger value="expiry" className={cn(form.errors?.expiracy_error ? 'text-destructive' : '')}>
            {t('Expiry')}
          </TabsTrigger>
          <TabsTrigger value="taxes" className={cn(form.errors?.taxes_error ? 'text-destructive' : '')}>
            {t('Taxes')}
          </TabsTrigger>
          <TabsTrigger value="images" className={cn(form.errors?.images_error ? 'text-destructive' : '')}>
            {t('Images')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identification" className="mt-6">
          <IdentificationTab form={form} handleInputChange={handleInputChange} />
        </TabsContent>

        {isGrouped && (
          <TabsContent value="groups" className="mt-6">
            <GroupsTab form={form} />
          </TabsContent>
        )}

        <TabsContent value="units" className="mt-6">
          <UnitsTab form={form} handleInputChange={handleInputChange} />
        </TabsContent>

        <TabsContent value="expiry" className="mt-6">
          <ExpiryTab form={form} handleInputChange={handleInputChange} />
        </TabsContent>

        <TabsContent value="taxes" className="mt-6">
          <TaxesTab form={form} handleInputChange={handleInputChange} />
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <ImagesTab form={form} handleInputChange={handleInputChange} />
        </TabsContent>
      </Tabs>
    </>
  );
}
