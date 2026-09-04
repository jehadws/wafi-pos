'use client';

import FormField from '@/components/forms/shared/form-field';
import ToggleButtons from '@/components/forms/shared/toggle-buttons';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import SellingGroupCard from './selling-group-card';
import type { UnitsTabProps } from './types';

export default function UnitsTab({ form, handleInputChange }: UnitsTabProps) {
    const { t } = useTranslation();
    const { unitGroups } = usePage<{ unitGroups: UnitGroupWithUnits[] }>().props;

    const addSellingGroup = () => {
        const newSellingGroup = {
            cogs: 0,
            convert_unit_id: '',
            low_quantity: 0,
            preview_url: '',
            quantity: 0,
            sale_price_edit: '',
            stock_alert_enabled: false,
            unit_id: '',
            visible: true,
            wholesale_price_edit: '',
        };

        form.setData({
            ...form.data,
            units_selling_group: [...form.data.units_selling_group, newSellingGroup],
        });

        if (form.errors.units_error) form.clearErrors('units_error');
        if (form.errors.units_selling_group) form.clearErrors('units_selling_group');
    };

    const removeSellingGroup = (index: number) => {
        const newSellingGroups = [...form.data.units_selling_group];
        newSellingGroups.splice(index, 1);

        form.setData({
            ...form.data,
            units_selling_group: newSellingGroups,
        });

        if (form.errors[`units_selling_group.${index}.unit_id`]) form.clearErrors(`units_selling_group.${index}.unit_id`);
        if (form.errors.units_error) form.clearErrors('units_error');
        if (form.errors.units_selling_group) form.clearErrors('units_selling_group');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-6">
                    <FormField
                        htmlFor="unit_group"
                        label={t('Unit Group')}
                        description={t('What unit group applies to the actual item. This group will apply during the procurement.')}
                        error={form.errors?.units_unit_group}
                        required
                    >
                        <Select
                            value={form.data.units_unit_group?.toString()}
                            onValueChange={(value) => handleInputChange('units_unit_group', value)}
                            defaultValue="Select Unit Group"
                            disabled={form.data.units_unit_group && form.data.units_selling_group.length > 0}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('Select Unit Group')} />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                {unitGroups?.map((group) => (
                                    <SelectItem key={group.id} value={group.id.toString()}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                    <FormField
                        label={t('Accurate Tracking')}
                        htmlFor="accurate_tracking"
                        description={t("The product won't be visible on the grid and fetched only using the barcode reader or associated barcode.")}
                    >
                        <ToggleButtons
                            value={form.data.units_accurate_tracking}
                            onChange={(value) => handleInputChange('units_accurate_tracking', value)}
                        />
                    </FormField>

                    <FormField
                        label={t('Auto COGS')}
                        htmlFor="auto_cogs"
                        description={t('The Cost Of Goods Sold will be automatically be computed based on procurement and conversion.')}
                    >
                        <ToggleButtons value={form.data.units_auto_cogs} onChange={(value) => handleInputChange('units_auto_cogs', value)} />
                    </FormField>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">{t('Selling Groups')}</Label>
                        <Button type="button" onClick={addSellingGroup} variant="outline" size="sm">
                            <Plus className="me-2 h-4 w-4" />
                            {t('New Group')}
                        </Button>
                    </div>

                    {form?.errors['units_selling_group'] && <p className="text-sm text-red-600">{form?.errors['units_selling_group']}</p>}
                    {form?.data?.units_selling_group?.map((group, index) => (
                        <SellingGroupCard
                            key={group.id || index}
                            form={form}
                            index={index}
                            units={unitGroups.find((group) => group.id == form.data.units_unit_group)?.units || []}
                            onRemove={() => removeSellingGroup(index)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
