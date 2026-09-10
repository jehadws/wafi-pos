import { SbCrudForm } from '@/components/forms/config-form/sb-crud-form';
import FormField from '@/components/forms/shared/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n';
import { usePage } from '@inertiajs/react';
import ToggleButtons from '../shared/toggle-buttons';
import { IdentificationTabProps, ProductFormData } from './types';

export default function IdentificationTab({ form, handleInputChange }: IdentificationTabProps) {
    const { t } = useTranslation();
    const { categories } = usePage<{ categories: CategoryProduct[] }>().props;

    const categoryField = {
        name: 'category_id',
        label: t('Category'),
        type: 'search-select',
        component: 'sbCrudForm',
        namespace: 'sb.products-categories',
        validation: 'required',
        options: categories.map((category) => ({ label: category.name, value: category.id })),
        description: t('Select to which category the item is assigned.'),
    } as const;

    const handleChange = (name: keyof ProductFormData, value: string | number | number[]) => {
        handleInputChange(name, value);

        if (form.errors[name]) form.clearErrors(name);
        if (form.errors.identification_error) form.clearErrors('identification_error');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                    label={t('Category')}
                    htmlFor="identification_category_id"
                    description={t('Select to which category the item is assigned.')}
                    error={form.errors?.identification_category_id}
                    required
                >
                    <SbCrudForm
                        field={categoryField}
                        value={form.data.identification_category_id}
                        onChange={(value) => handleChange('identification_category_id', value as number)}
                        error={form.errors?.identification_category_id}
                        id="identification_category_id"
                    />
                </FormField>

                <FormField
                    label={t('SKU')}
                    htmlFor="identification_sku"
                    description={t('Define a unique SKU value for the product.')}
                    error={form.errors?.identification_sku}
                >
                    <Input
                        id="identification_sku"
                        name="identification_sku"
                        value={form.data.identification_sku}
                        onChange={(e) => handleChange('identification_sku', e.target.value)}
                        placeholder={t('Enter SKU')}
                        className={form.errors?.identification_sku ? 'border-red-500' : ''}
                    />
                </FormField>

                <FormField
                    label={t('Barcode')}
                    htmlFor="identification_barcode"
                    description={t('Define the barcode value. Focus the cursor here before scanning the product.')}
                    error={form.errors?.identification_barcode}
                >
                    <Input
                        id="identification_barcode"
                        name="identification_barcode"
                        value={form.data.identification_barcode}
                        onChange={(e) => handleChange('identification_barcode', e.target.value)}
                        placeholder={t('Enter barcode')}
                        className={form.errors?.identification_barcode ? 'border-red-500' : ''}
                    />
                </FormField>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                    label={t('Barcode Type')}
                    htmlFor="identification_barcode_type"
                    description={t('Define the barcode type scanned.')}
                    error={form.errors?.identification_barcode_type}
                >
                    <Select
                        value={form.data.identification_barcode_type}
                        onValueChange={(value) => handleChange('identification_barcode_type', value)}
                        defaultValue="no"
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ean8">{t('EAN 8')}</SelectItem>
                            <SelectItem value="ean13">{t('EAN 13')}</SelectItem>
                            <SelectItem value="codabar">{t('Codabar')}</SelectItem>
                            <SelectItem value="code128">{t('Code 128')}</SelectItem>
                            <SelectItem value="code39">{t('Code 39')}</SelectItem>
                            <SelectItem value="code11">{t('Code 11')}</SelectItem>
                            <SelectItem value="upca">{t('UPC A')}</SelectItem>
                            <SelectItem value="upce">{t('UPC E')}</SelectItem>
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('Type')}
                    htmlFor="identification_type"
                    description={t('Define the product type.')}
                    error={form.errors?.identification_type}
                >
                    <Select
                        value={form.data.identification_type}
                        onValueChange={(value) => handleChange('identification_type', value)}
                        defaultValue="materialized"
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="materialized">{t('Materialized Product')}</SelectItem>
                            <SelectItem value="dematerialized">{t('Dematerialized Product')}</SelectItem>
                            <SelectItem value="grouped">{t('Grouped Product')}</SelectItem>
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('Status')}
                    htmlFor="identification_status"
                    description={t('Define whether the product is available for sale.')}
                    error={form.errors?.identification_status}
                >
                    <Select
                        value={form.data.identification_status}
                        onValueChange={(value) => handleChange('identification_status', value)}
                        defaultValue="available"
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="available">{t('On Sale')}</SelectItem>
                            <SelectItem value="unavailable">{t('Hidden')}</SelectItem>
                        </SelectContent>
                    </Select>
                </FormField>
            </div>

            <FormField
                label={t('Stock Management Enabled')}
                htmlFor="identification_stock_management"
                description={t('Enable the stock management on the product. Will not work for service or uncountable products.')}
                error={form.errors?.identification_stock_management}
            >
                <ToggleButtons
                    value={form.data.identification_stock_management === 'enabled'}
                    onChange={(value) => handleChange('identification_stock_management', value ? 'enabled' : 'disabled')}
                />
            </FormField>

            <FormField
                label={t('Description')}
                htmlFor="identification_description"
                description={t('Provide a detailed description of the product.')}
                error={form.errors?.identification_description}
            >
                <Textarea
                    id="identification_description"
                    name="identification_description"
                    value={form.data.identification_description || ''}
                    onChange={(e) => handleChange('identification_description', e.target.value)}
                    placeholder={t('Enter product description')}
                    className={form.errors?.identification_description ? 'border-red-500' : ''}
                    rows={4}
                />
            </FormField>
        </div>
    );
}
