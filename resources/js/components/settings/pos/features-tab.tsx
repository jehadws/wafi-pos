import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { MultiSelector } from '@/components/ui/multi-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import type { PosSettingsPayload, PosSettingsOptions } from './types';

interface FeaturesTabProps {
    form: {
        data: PosSettingsPayload;
        setData: (field: string, value: any) => void;
    };
    options: PosSettingsOptions;
}

export function FeaturesTab({ form, options }: FeaturesTabProps) {
    const { t } = useTranslation();

    const renderToggle = (field: string, currentValue: string | null | undefined, labelYes = 'Yes', labelNo = 'No') => (
        <div className="flex gap-2">
            <Button
                type="button"
                variant={(currentValue ?? 'no') === 'yes' ? 'default' : 'outline'}
                onClick={() => form.setData(field, 'yes')}
            >
                {t(labelYes)}
            </Button>
            <Button
                type="button"
                variant={(currentValue ?? 'no') === 'no' ? 'default' : 'outline'}
                onClick={() => form.setData(field, 'no')}
            >
                {t(labelNo)}
            </Button>
        </div>
    );

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FormField
                label={t('Show Quantity')}
                description={t('Will show the quantity selector while choosing a product. Otherwise the default quantity is set to 1.')}
            >
                {renderToggle('features.ns_jgrem_show_quantity', form.data.features.ns_jgrem_show_quantity)}
            </FormField>

            <FormField
                label={t('Merge Similar Items')}
                description={t('Will enforce similar products to be merged from the POS.')}
            >
                {renderToggle('features.ns_jgrem_items_merge', form.data.features.ns_jgrem_items_merge)}
            </FormField>

            <FormField
                label={t('Allow Wholesale Price')}
                description={t('Define if the wholesale price can be selected on the POS.')}
            >
                {renderToggle('features.ns_jgrem_allow_wholesale_price', form.data.features.ns_jgrem_allow_wholesale_price)}
            </FormField>

            <FormField
                label={t('Allow Decimal Quantities')}
                description={t('Will change the numeric keyboard for allowing decimal for quantities. Only for "default" numpad.')}
            >
                {renderToggle('features.ns_jgrem_allow_decimal_quantities', form.data.features.ns_jgrem_allow_decimal_quantities)}
            </FormField>

            <FormField label={t('Quick Product')} description={t('Allow quick product to be created from the POS.')}>
                {renderToggle('features.ns_jgrem_quick_product', form.data.features.ns_jgrem_quick_product)}
            </FormField>

            <FormField
                label={t('Quick Product Default Unit')}
                description={t('Set what unit is assigned by default to all quick product.')}
            >
                <Select
                    value={form.data.features.ns_jgrem_quick_product_default_unit || ''}
                    onValueChange={(v) => form.setData('features.ns_jgrem_quick_product_default_unit', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Select an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem key="null" value="null">
                            {t('Select an option')}
                        </SelectItem>
                        {options.ns_jgrem_quick_product_default_unit.map((l) => (
                            <SelectItem key={l.value} value={l.value.toString() || 'null'}>
                                {l.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label={t('Editable Unit Price')} description={t('Allow product unit price to be edited.')}>
                {renderToggle('features.ns_jgrem_unit_price_ediable', form.data.features.ns_jgrem_unit_price_ediable)}
            </FormField>

            <FormField label={t('Show Price With Tax')} description={t('Will display price with tax for each products.')}>
                {renderToggle('features.ns_jgrem_price_with_tax', form.data.features.ns_jgrem_price_with_tax)}
            </FormField>

            <FormField label={t('Order Types')} description={t('Control the order type enabled.')}>
                <MultiSelector
                    value={form.data.features.ns_jgrem_order_types || []}
                    options={options.ns_jgrem_order_types.map((l) => ({ id: l.value, name: l.label }))}
                    onChange={(v) => form.setData('features.ns_jgrem_order_types', v)}
                />
            </FormField>

            <FormField label={t('Numpad')} description={t('Will set what is the numpad used on the POS screen.')}>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={(form.data.features.ns_jgrem_numpad ?? 'default') === 'default' ? 'default' : 'outline'}
                        onClick={() => form.setData('features.ns_jgrem_numpad', 'default')}
                    >
                        {t('Default')}
                    </Button>
                    <Button
                        type="button"
                        variant={(form.data.features.ns_jgrem_numpad ?? 'default') === 'advanced' ? 'default' : 'outline'}
                        onClick={() => form.setData('features.ns_jgrem_numpad', 'advanced')}
                    >
                        {t('Advanced')}
                    </Button>
                </div>
            </FormField>

            <FormField
                label={t('Force Barcode Auto Focus')}
                description={t('Will permanently enable barcode autofocus to ease using a barcode reader.')}
            >
                {renderToggle('features.ns_jgrem_force_autofocus', form.data.features.ns_jgrem_force_autofocus)}
            </FormField>

            <FormField
                label={t('Hide Exhausted Products')}
                description={t('Will hide exhausted products from selection on the POS.')}
            >
                {renderToggle('features.ns_jgrem_hide_exhausted_products', form.data.features.ns_jgrem_hide_exhausted_products)}
            </FormField>

            <FormField
                label={t('Hide Empty Category')}
                description={t('Category with no or exhausted products will be hidden from selection.')}
            >
                {renderToggle('features.ns_jgrem_hide_empty_categories', form.data.features.ns_jgrem_hide_empty_categories)}
            </FormField>
        </div>
    );
}
