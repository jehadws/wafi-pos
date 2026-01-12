import { Head } from '@inertiajs/react';

import { useTranslation } from '@/lib/i18n';

import ExpiryTab from '@/components/forms/product-form/expiry-tab';
import IdentificationTab from '@/components/forms/product-form/identification-tab';
import ImagesTab from '@/components/forms/product-form/images-tab';
import TaxesTab from '@/components/forms/product-form/taxes-tab';
import { defaultFormData, ProductFormData } from '@/components/forms/product-form/types';
import UnitsTab from '@/components/forms/product-form/units-tab';
import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/tabs';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Products', href: '/dashboard/products' },
    { title: 'Create Product', href: '/dashboard/products/create' },
];

export default function CreateProductPage() {
    const { t } = useTranslation();
    const form = useForm<ProductFormData>({
        ...defaultFormData,
    });

    const handleInputChange = (name: keyof ProductFormData, value: string | number | number[] | boolean) => {
        form.setData({ ...form.data, [name]: value });

        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleFileChange = (files: File[]) => {
        const fileUrls = files.map((file) => URL.createObjectURL(file));

        form.setData({
            ...form.data,
            // images: [...form.data.images, ...fileUrls],
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) return;

        const data = {
            name: form.data.name,
            variations: [
                {
                    identification: {
                        category_id: form.data.identification_category_id,
                        barcode: form.data.identification_barcode,
                        sku: form.data.identification_sku,
                        barcode_type: form.data.identification_barcode_type,
                        type: form.data.identification_type,
                        status: form.data.identification_status,
                        stock_management: form.data.identification_stock_management,
                        description: form.data.identification_description,
                    },
                    groups: {
                        ...form.data.groups_product_subitems,
                    },
                    units: {
                        unit_group: form.data.units_unit_group,
                        accurate_tracking: form.data.units_accurate_tracking,
                        auto_cogs: form.data.units_auto_cogs,
                        selling_group: form.data.units_selling_group,
                    },
                    expiracy: {
                        expires: form.data.expiracy_expires,
                        on_expiration: form.data.expiracy_on_expiration,
                    },
                    taxes: {
                        tax_group_id: form.data.taxes_tax_group_id,
                        tax_type: form.data.taxes_tax_type,
                    },
                    images: {
                        ...form.data.images,
                    },
                    $primary: true,
                },
            ],
        };
        form.transform(() => data);

        console.log('Form data:', data);

        form.post('/api/products', {
            preserveScroll: true,
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error(t('The form is not valid. Please check it and try again'));
            },
            onSuccess: () => {
                toast.success(t('A new entry has been successfully created.'));
            },
        });
    };

    const validateForm = () => {
        let isValid = true;

        // Clear all previous errors
        form.clearErrors();

        // Required fields validation - Product name
        if (!form.data.name.trim()) {
            form.setError('name', t('Product name is required'));
            isValid = false;
        }

        // Identification tab validation
        if (!form.data.identification_category_id) {
            form.setError('identification_category_id', t('Category is required'));
            form.setError('identification_error', t('This field is required'));
            toast.error(t('Category is required'));
            isValid = false;
        }

        // Units tab validation
        if (!form.data.units_unit_group) {
            form.setError('units_unit_group', t('Unit group is required'));
            form.setError('units_error', t('This field is required'));
            toast.error(t('Unit group is required'));
            isValid = false;
        }

        // Validate selling groups
        if (form.data.units_selling_group.length === 0) {
            form.setError('units_selling_group', t('At least one selling group is required'));
            form.setError('units_error', t('This field is required'));
            toast.error(t('At least one selling group is required'));
            isValid = false;
        } else {
            // Check for duplicate units in selling groups
            const unitIds = form.data.units_selling_group.map((group) => group.unit_id).filter(Boolean);
            const uniqueUnitIds = new Set(unitIds);

            if (unitIds.length !== uniqueUnitIds.size) {
                form.setError('units_selling_group', t('Each unit can only be used once'));
                form.setError('units_error', t('Each unit can only be used once'));
                toast.error(t('Each unit can only be used once'));
                isValid = false;
            }

            // Validate each selling group
            form.data.units_selling_group.forEach((group, index) => {
                if (!group.unit_id) {
                    form.setError(`units_selling_group.${index}.unit_id`, t('Unit is required'));
                    form.setError('units_error', t('This field is required'));
                    isValid = false;
                }

                if (group.unit_id && group.convert_unit_id && group.unit_id === group.convert_unit_id) {
                    form.setError(`units_selling_group.${index}.convert_unit_id`, t('Unit cannot be same as convert unit'));
                    form.setError('units_error', t('This field is required'));
                    toast.error(t('Unit cannot be same as convert unit'));
                    isValid = false;
                }

                // Validate numeric fields
                if (group.quantity && isNaN(Number(group.quantity))) {
                    form.setError(`units_selling_group.${index}.quantity`, t('Quantity must be a number'));
                    form.setError('units_error', t('This field is required'));
                    isValid = false;
                }

                if (group.low_quantity && isNaN(Number(group.low_quantity))) {
                    form.setError(`units_selling_group.${index}.low_quantity`, t('Low quantity must be a number'));
                    form.setError('units_error', t('This field is required'));
                    isValid = false;
                }
            });
        }

        return isValid;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create a new product')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new product')}
                        description={t('Register a new product and save it.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    {/* Product Name */}
                    <FormField label={t('Name')} error={form.errors.name} description={t('Provide a name to the resource.')} className="mb-6">
                        <Input
                            id="name"
                            name="name"
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={cn(form.errors.name && 'border-destructive')}
                            placeholder={t('Enter product name')}
                            required
                        />
                    </FormField>

                    {/* Tabs */}
                    <Tabs defaultValue="identification" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="identification" className={cn(form.errors?.identification_error ? 'text-destructive' : '')}>
                                {t('Identification')}
                            </TabsTrigger>
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
                </div>
            </form>
        </AppLayout>
    );
}
