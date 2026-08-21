/**
 * pages/dashboard/products/product-form-fields.tsx
 *
 * Pure presentation component — renders product name field and all 5 tabs.
 * Receives the form object and handlers as props.
 *
 * Shared by create.tsx and edit.tsx.
 */

import React from 'react';
import ExpiryTab from '@/components/forms/product-form/expiry-tab';
import IdentificationTab from '@/components/forms/product-form/identification-tab';
import ImagesTab from '@/components/forms/product-form/images-tab';
import TaxesTab from '@/components/forms/product-form/taxes-tab';
import UnitsTab from '@/components/forms/product-form/units-tab';
import FormField from '@/components/forms/shared/form-field';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import { ProductFormData } from '@/components/forms/product-form/types';
import { InertiaFormProps } from '@inertiajs/react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProductFormFieldsProps {
    form: InertiaFormProps<ProductFormData>;
    handleInputChange: (name: keyof ProductFormData, value: any) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductFormFields({ form, handleInputChange }: ProductFormFieldsProps) {
    const { t } = useTranslation();

    return (
        <>
            {/* Product Name */}
            <FormField
                label={t('Name')}
                error={form.errors?.name}
                description={t('Provide a name to the resource.')}
                className="mb-6"
            >
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
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger
                        value="identification"
                        className={cn(form.errors?.identification_error ? 'text-destructive' : '')}
                    >
                        {t('Identification')}
                    </TabsTrigger>
                    <TabsTrigger
                        value="units"
                        className={cn(form.errors?.units_error ? 'text-destructive' : '')}
                    >
                        {t('Units')}
                    </TabsTrigger>
                    <TabsTrigger
                        value="expiry"
                        className={cn(form.errors?.expiracy_error ? 'text-destructive' : '')}
                    >
                        {t('Expiry')}
                    </TabsTrigger>
                    <TabsTrigger
                        value="taxes"
                        className={cn(form.errors?.taxes_error ? 'text-destructive' : '')}
                    >
                        {t('Taxes')}
                    </TabsTrigger>
                    <TabsTrigger
                        value="images"
                        className={cn(form.errors?.images_error ? 'text-destructive' : '')}
                    >
                        {t('Images')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="identification" className="mt-6">
                    <IdentificationTab form={form} handleInputChange={handleInputChange} />
                </TabsContent>

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
