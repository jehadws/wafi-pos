import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

import FormField from '@/components/forms/shared/form-field';
import FormHeader from '@/components/forms/shared/form-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { MultiSelector } from '@/components/ui/multi-selector';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Select } from '@radix-ui/react-select';
import axios from 'axios';
import { format } from 'date-fns';
import { DollarSignIcon, PackageIcon, PercentIcon, TagIcon, UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Coupons', href: '/dashboard/customers/coupons' },
    { title: 'Edit Coupon', href: '/dashboard/customers/coupons' },
];

const discountTypes = [
    { value: 'percentage_discount', label: 'Percentage Discount', icon: PercentIcon },
    { value: 'flat_discount', label: 'Fixed Amount', icon: DollarSignIcon },
];

export default function CreateCuponPage() {
    const { t } = useTranslation();
    const discountTypesTranslated = [
        { value: 'percentage_discount', label: t('Percentage Discount'), icon: PercentIcon },
        { value: 'flat_discount', label: t('Flat Discount'), icon: DollarSignIcon },
    ];
    const { coupon } = usePage<{ coupon: Coupon }>().props;
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [groups, setGroups] = useState([]);
    const [activeTab, setActiveTab] = useState('products');

    console.log(coupon);

    const form = useForm({
        name: coupon.name,
        code: coupon.code,
        type: coupon.type,
        discount_value: coupon.discount_value,
        minimum_cart_value: coupon.minimum_cart_value,
        maximum_cart_value: coupon.maximum_cart_value,
        valid_until: coupon.valid_until,
        valid_hours_end: coupon.valid_hours_end,
        valid_hours_start: coupon.valid_hours_start,
        limit_usage: coupon.limit_usage,
        description: coupon.description,
        selected_products: coupon.products?.map((product) => product.product_id) || [],
        selected_categories: coupon.categories?.map((category) => category.category_id) || [],
        selected_groups: coupon.groups?.map((group) => group.group_id) || [],
    });

    console.log(
        'selected cate',
        coupon.categories?.map((category) => category.category_id),
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSelectChange = (name: string, value: string | number | number[]) => {
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) return;

        form.transform(() => ({
            name: form.data.name,
            general: {
                code: form.data.code,
                discount_value: form.data.discount_value,
                limit_usage: form.data.limit_usage,
                maximum_cart_value: form.data.maximum_cart_value,
                minimum_cart_value: form.data.minimum_cart_value,
                type: form.data.type,
                valid_hours_end: format(form.data.valid_hours_end, 'yyyy-MM-dd HH:mm:ss'),
                valid_hours_start: format(form.data.valid_hours_start, 'yyyy-MM-dd HH:mm:ss'),
                valid_until: form.data.valid_until,
            },
            selected_categories: {
                categories: form.data.selected_categories,
            },
            selected_groups: {
                groups: form.data.selected_groups,
            },
            selected_products: {
                products: form.data.selected_products,
            },
        }));

        form.put(`/api/crud/ns.coupons/${coupon.id}`, {
            preserveScroll: true,
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error(t('Please fix the validation errors'));
            },
            onSuccess: () => {
                toast.success(t('Successfully saved'));
            },
        });
    };

    const validateForm = () => {
        const isValid = true;
        form.clearErrors();

        // if (!form.data.first_name.trim()) {
        //   form.setError('first_name', 'Role name is required');
        //   isValid = false;
        // }

        return isValid;
    };

    const generateCouponCode = () => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        form.setData({ ...form.data, code });
        toast.info(`Generated code: ${code}`);
    };

    useEffect(() => {
        const getData = async () => {
            const [productsRes, categoriesRes, groupsRes] = await Promise.all([
                axios.get('/api/products').then((res) => res.data),
                axios.get('/api/categories').then((res) => res.data),
                axios.get('/api/customers-groups').then((res) => res.data),
            ]);
            setProducts(productsRes);
            setCategories(categoriesRes);
            setGroups(groupsRes);
        };

        getData();
    }, []);

    const selectedDiscountType = discountTypes.find((type) => type.value === form.data.type);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Edit coupon')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Edit coupon')}
                        description={t('Modify  Coupon.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField label="Coupon Name" description="Provide a name for the coupon" required error={form.errors.name}>
                                <Input
                                    id="name"
                                    name="name"
                                    onChange={handleInputChange}
                                    className={cn(form.errors.name && 'border-destructive')}
                                    required
                                    value={form.data.name}
                                    placeholder="e.g., Summer Sale 2024"
                                />
                            </FormField>

                            <FormField
                                label={t('Coupon Code')}
                                description={t('Code customers will use to apply the discount')}
                                required
                                htmlFor="code"
                                error={form.errors.code}
                            >
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={t('e.g., SUMMER20')}
                                        id="code"
                                        name="code"
                                        value={form.data.code}
                                        onChange={handleInputChange}
                                        className={cn(form.errors.code && 'border-destructive', 'uppercase')}
                                        required
                                    />
                                    <Button type="button" variant="outline" onClick={generateCouponCode}>
                                        {t('Generate')}
                                    </Button>
                                </div>
                            </FormField>
                        </div>

                        <FormField
                            label={t('Usage Limit')}
                            description={t('How many times it can be used')}
                            htmlFor="limit_usage"
                            error={form.errors.limit_usage}
                        >
                            <Textarea
                                id="description"
                                name="description"
                                value={form.data.description || ''}
                                onChange={handleInputChange}
                                placeholder={t('Describe the purpose of this coupon...')}
                                className={cn(form.errors.description && 'border-destructive', 'min-h-[80px]')}
                            />
                        </FormField>

                        {/* Discount Configuration */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField
                                label={t('Discount Type')}
                                description={t('Choose how the discount will be applied')}
                                required
                                htmlFor="type"
                                error={form.errors.type}
                            >
                                <Select
                                    onValueChange={(value: 'percentage' | 'fixed_amount' | 'free_shipping') => handleSelectChange('type', value)}
                                    value={form.data.type}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {discountTypesTranslated.map((type) => {
                                            const Icon = type.icon;
                                            return (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4" />
                                                        {type.label}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </FormField>

                            <FormField
                                label={t('Discount Value')}
                                description={form.data.type === 'percentage_discount' ? t('Percentage discount (0-100)') : t('Fixed amount discount')}
                                required
                                htmlFor="discount_value"
                                error={form.errors.discount_value}
                            >
                                <div className="relative">
                                    <Input
                                        type="number"
                                        placeholder={form.data.type === 'percentage_discount' ? t('20') : t('10.00')}
                                        id="discount_value"
                                        name="discount_value"
                                        value={form.data.discount_value}
                                        onChange={handleInputChange}
                                        className={cn(
                                            form.data.type === 'percentage_discount' ? 'pr-8' : 'pl-8',
                                            form.errors.discount_value && 'border-destructive',
                                        )}
                                        required
                                    />
                                    {form.data.type === 'percentage_discount' ? (
                                        <PercentIcon className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
                                    ) : (
                                        <DollarSignIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                                    )}
                                </div>
                            </FormField>
                        </div>

                        {selectedDiscountType && (
                            <div className="bg-muted/30 rounded-lg p-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <selectedDiscountType.icon className="h-4 w-4" />
                                    <span className="font-medium">Preview</span>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    {form.data.type === 'percentage_discount' &&
                                        form.data.discount_value > 0 &&
                                        `Customers will get ${form.data.discount_value}% off their order`}
                                    {form.data.type === 'flat_discount' &&
                                        form.data.discount_value > 0 &&
                                        `Customers will get $${form.data.discount_value} off their order`}
                                </p>
                            </div>
                        )}

                        {/* Validity & Restrictions */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
                            <FormField label="Valid From" description="Define form which hour during the day the coupons is valid.">
                                <DatePicker
                                    date={form.data.valid_hours_start}
                                    onDateChange={(date) => form.setData({ ...form.data, valid_hours_start: date })}
                                    placeholder="Select expiry date"
                                    fromDate={new Date()}
                                />
                            </FormField>

                            <FormField label="Valid Till" description="Define to which hour during the day the coupons end stop valid.">
                                <DatePicker
                                    date={form.data.valid_hours_end}
                                    onDateChange={(date) => form.setData({ ...form.data, valid_hours_end: date, valid_until: date })}
                                    placeholder="Select expiry date"
                                    disabled={form.data.valid_hours_start === null}
                                    fromDate={form.data.valid_hours_start}
                                />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <FormField
                                label={t('Minimum Cart Value')}
                                description={t('Minimum order amount required')}
                                htmlFor="minimum_cart_value"
                                error={form.errors.minimum_cart_value}
                            >
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        id="minimum_cart_value"
                                        name="minimum_cart_value"
                                        value={form.data.minimum_cart_value}
                                        onChange={handleInputChange}
                                        className={cn('pl-8', form.errors.minimum_cart_value && 'border-destructive')}
                                    />
                                    <DollarSignIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                                </div>
                            </FormField>

                            <FormField
                                label={t('Maximum Cart Value')}
                                description={t('Maximum order amount allowed')}
                                htmlFor="maximum_cart_value"
                                error={form.errors.maximum_cart_value}
                            >
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        id="maximum_cart_value"
                                        name="maximum_cart_value"
                                        value={form.data.maximum_cart_value}
                                        onChange={handleInputChange}
                                        className={cn('pl-8', form.errors.maximum_cart_value && 'border-destructive')}
                                    />
                                    <DollarSignIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                                </div>
                            </FormField>

                            <FormField label={t('Coupon Name')} description={t('Provide a name for the coupon')} required error={form.errors.name}>
                                <Input
                                    id="name"
                                    name="name"
                                    onChange={handleInputChange}
                                    className={cn(form.errors.name && 'border-destructive')}
                                    required
                                    value={form.data.name}
                                    placeholder={t('e.g., Summer Sale 2024')}
                                />
                            </FormField>
                        </div>

                        {/* Applicable Items */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="products" className={cn('flex items-center gap-2', activeTab === 'products' ? 'bg-black' : '')}>
                                    <PackageIcon className="h-4 w-4" />
                                    Products
                                    {form.data.selected_products.length > 0 && (
                                        <Badge variant="secondary" className="ml-1">
                                            {form.data.selected_products.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="categories" className="flex items-center gap-2">
                                    <TagIcon className="h-4 w-4" />
                                    Categories
                                    {form.data.selected_categories.length > 0 && (
                                        <Badge variant="secondary" className="ml-1">
                                            {form.data.selected_categories.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="customers" className="flex items-center gap-2">
                                    <UsersIcon className="h-4 w-4" />
                                    Customer Groups
                                    {form.data.selected_groups.length > 0 && (
                                        <Badge variant="secondary" className="ml-1">
                                            {form.data.selected_groups.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="products" className="mt-6 space-y-4">
                                <FormField
                                    label="Select Products"
                                    description="Choose specific products this coupon applies to. Leave empty to apply to all products."
                                >
                                    <MultiSelector
                                        options={products}
                                        value={form.data.selected_products}
                                        onChange={(value) => handleSelectChange('selected_products', value)}
                                        placeholder="Select products..."
                                        searchPlaceholder="Search products..."
                                        emptyText="No products found"
                                    />
                                </FormField>
                            </TabsContent>

                            <TabsContent value="categories" className="mt-6 space-y-4">
                                <FormField
                                    label="Select Categories"
                                    description="Choose product categories this coupon applies to. Leave empty to apply to all categories."
                                >
                                    <MultiSelector
                                        options={categories}
                                        value={form.data.selected_categories}
                                        onChange={(value) => handleSelectChange('selected_categories', value)}
                                        placeholder="Select categories..."
                                        searchPlaceholder="Search categories..."
                                        emptyText="No categories found"
                                    />
                                </FormField>
                            </TabsContent>

                            <TabsContent value="customers" className="mt-6 space-y-4">
                                <FormField
                                    label="Select Customer Groups"
                                    description="Choose which customer groups can use this coupon. Leave empty to allow all customers."
                                >
                                    <MultiSelector
                                        options={groups}
                                        value={form.data.selected_groups}
                                        onChange={(value) => handleSelectChange('selected_groups', value)}
                                        placeholder="Select customer groups..."
                                        searchPlaceholder="Search customer groups..."
                                        emptyText="No customer groups found"
                                    />
                                </FormField>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
