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
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, useForm } from '@inertiajs/react';
import { Select } from '@radix-ui/react-select';
import { categoriesApi, customersApi, productsApi } from '@/api';
import { format } from 'date-fns';
import { DollarSignIcon, PackageIcon, PercentIcon, TagIcon, UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const discountTypes = [
    { value: 'percentage_discount', label: 'Percentage Discount', icon: PercentIcon },
    { value: 'flat_discount', label: 'Fixed Amount', icon: DollarSignIcon },
];

export default function CreateCuponPage() {
    const { t } = useTranslation();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [groups, setGroups] = useState([]);
    const [activeTab, setActiveTab] = useState('products');

    const form = useForm({
        name: '',
        code: '',
        type: 'percentage_discount',
        discount_value: 0,
        minimum_cart_value: 0,
        maximum_cart_value: 0,
        valid_until: Date.now(),
        valid_hours_end: Date.now(),
        valid_hours_start: Date.now(),
        limit_usage: 1,
        description: '',
        selected_products: [],
        selected_categories: [],
        selected_groups: [],
    });

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

        form.post('/api/crud/ns.coupons', {
            preserveScroll: true,
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error(t('Please fix the validation errors'));
            },
            onSuccess: () => {
                toast.success(t('Coupon created successfully'));
            },
        });
    };

    const validateForm = () => {
        const isValid = true;
        form.clearErrors();

        return isValid;
    };

    const generateCouponCode = () => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        form.setData({ ...form.data, code });
        toast.info(t('Generated code: {{code}}', { code }));
    };

    useEffect(() => {
        const getData = async () => {
            const [productsRes, categoriesRes, groupsRes] = await Promise.all([
                productsApi.getAll(),
                categoriesApi.getAll(),
                customersApi.getGroups(),
            ]);
            setProducts(productsRes);
            setCategories(categoriesRes);
            setGroups(groupsRes);
        };

        getData();
    }, []);

    const selectedDiscountType = discountTypes.find((type) => type.value === '');

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('Dashboard'), href: '/dashboard' },
                { title: t('Coupons'), href: '/dashboard/customers/coupons' },
            ]}
        >
            <Head title={t('Create a new coupon - JGREM')} />

            <form onSubmit={handleSubmit}>
                <div className="bg-background flex h-full min-h-screen flex-1 flex-col gap-4 p-4">
                    <FormHeader
                        title={t('Create a new coupon')}
                        description={t('Register a new coupon and save it.')}
                        onCancel={() => window.history.back()}
                        onSave={() => {}}
                        form={form}
                    />

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                            label={t('Description')}
                            description={t('Optional description for internal use')}
                            htmlFor="description"
                            error={form.errors.description}
                        >
                            <Textarea
                                id="description"
                                name="description"
                                value={form.data.description}
                                onChange={handleInputChange}
                                placeholder={t('Describe the purpose of this coupon...')}
                                className={cn(form.errors.description && 'border-destructive', 'min-h-[80px]')}
                            />
                        </FormField>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField
                                label={t('Discount Type')}
                                description={t('Choose how the discount will be applied')}
                                required
                                htmlFor="type"
                                error={form.errors.type}
                            >
                                <Select onValueChange={(value: 'percentage' | 'fixed_amount' | 'free_shipping') => handleSelectChange('type', value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {discountTypes.map((type) => {
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

                            {form.data.type !== 'free_shipping' && (
                                <FormField
                                    label={t('Discount Value')}
                                    description={form.data.type === 'percentage' ? t('Percentage discount (0-100)') : t('Fixed amount discount')}
                                    required
                                    htmlFor="discount_value"
                                    error={form.errors.discount_value}
                                >
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            placeholder={form.data.type === 'percentage' ? '20' : '10.00'}
                                            id="discount_value"
                                            name="discount_value"
                                            value={form.data.discount_value}
                                            onChange={handleInputChange}
                                            className={cn(
                                                form.data.type === 'percentage' ? 'pr-8' : 'pl-8',
                                                form.errors.discount_value && 'border-destructive',
                                            )}
                                            required
                                        />
                                        {form.data.type === 'percentage' ? (
                                            <PercentIcon className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
                                        ) : (
                                            <DollarSignIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                                        )}
                                    </div>
                                </FormField>
                            )}
                        </div>

                        {selectedDiscountType && (
                            <div className="bg-muted/30 rounded-lg p-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <selectedDiscountType.icon className="h-4 w-4" />
                                    <span className="font-medium">{t('Preview')}</span>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    {form.data.type === 'percentage' &&
                                        form.data.discount_value > 0 &&
                                        t('Customers will get {{value}}% off their order', { value: form.data.discount_value })}
                                    {form.data.type === 'fixed_amount' &&
                                        form.data.discount_value > 0 &&
                                        t('Customers will get ${{value}} off their order', { value: form.data.discount_value })}
                                    {form.data.type === 'free_shipping' && t('Customers will get free shipping on their order')}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
                            <FormField label={t('Valid From')} description={t('Define form which hour during the day the coupons is valid.')}>
                                <DatePicker
                                    date={form.data.valid_hours_start}
                                    onDateChange={(date) => form.setData({ ...form.data, valid_hours_start: date })}
                                    placeholder={t('Select expiry date')}
                                    fromDate={new Date()}
                                />
                            </FormField>

                            <FormField label={t('Valid Till')} description={t('Define to which hour during the day the coupons end stop valid.')}>
                                <DatePicker
                                    date={form.data.valid_hours_end}
                                    onDateChange={(date) => form.setData({ ...form.data, valid_hours_end: date, valid_until: date })}
                                    placeholder={t('Select expiry date')}
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

                            <FormField
                                label={t('Usage Limit')}
                                description={t('How many times it can be used')}
                                htmlFor="limit_usage"
                                error={form.errors.limit_usage}
                            >
                                <Input
                                    type="number"
                                    placeholder="1"
                                    id="limit_usage"
                                    name="limit_usage"
                                    value={form.data.limit_usage}
                                    onChange={handleInputChange}
                                    className={cn(form.errors.limit_usage && 'border-destructive')}
                                />
                            </FormField>
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="products" className={cn('flex items-center gap-2', activeTab === 'products' ? 'bg-black' : '')}>
                                    <PackageIcon className="h-4 w-4" />
                                    {t('Products')}
                                    {form.data.selected_products.length > 0 && (
                                        <Badge variant="secondary" className="ml-1">
                                            {form.data.selected_products.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="categories" className="flex items-center gap-2">
                                    <TagIcon className="h-4 w-4" />
                                    {t('Categories')}
                                    {form.data.selected_categories.length > 0 && (
                                        <Badge variant="secondary" className="ml-1">
                                            {form.data.selected_categories.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="customers" className="flex items-center gap-2">
                                    <UsersIcon className="h-4 w-4" />
                                    {t('Customer Groups')}
                                    {form.data.selected_groups.length > 0 && (
                                        <Badge variant="secondary" className="ml-1">
                                            {form.data.selected_groups.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="products" className="mt-6 space-y-4">
                                <FormField
                                    label={t('Select Products')}
                                    description={t(
                                        'The following products will be required to be present on the cart, in order for this coupon to be valid.',
                                    )}
                                >
                                    <MultiSelector
                                        options={products}
                                        value={form.data.selected_products}
                                        onChange={(value) => handleSelectChange('selected_products', value)}
                                        placeholder={t('Select products...')}
                                        searchPlaceholder={t('Search products...')}
                                        emptyText={t('No products found')}
                                    />
                                </FormField>
                            </TabsContent>

                            <TabsContent value="categories" className="mt-6 space-y-4">
                                <FormField
                                    label={t('Select Categories')}
                                    description={t(
                                        'The products assigned to one of these categories should be on the cart, in order for this coupon to be valid.',
                                    )}
                                >
                                    <MultiSelector
                                        options={categories}
                                        value={form.data.selected_categories}
                                        onChange={(value) => handleSelectChange('selected_categories', value)}
                                        placeholder={t('Select categories...')}
                                        searchPlaceholder={t('Search categories...')}
                                        emptyText={t('No categories found')}
                                    />
                                </FormField>
                            </TabsContent>

                            <TabsContent value="customers" className="mt-6 space-y-4">
                                <FormField
                                    label={t('Select Customer Groups')}
                                    description={t('Choose which customer groups can use this coupon. Leave empty to allow all customers.')}
                                >
                                    <MultiSelector
                                        options={groups}
                                        value={form.data.selected_groups}
                                        onChange={(value) => handleSelectChange('selected_groups', value)}
                                        placeholder={t('Select customer groups...')}
                                        searchPlaceholder={t('Search customer groups...')}
                                        emptyText={t('No customer groups found')}
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
