import SalesSummary from '@/components/pos/sales-summary';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import SelectableItem from '@/components/ui/selectable-item';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { User } from '@/types';
import { formatCurrency } from '@/utils/format';
import { categoriesApi, reportsApi, usersApi } from '@/api';
import { endOfToday, format, startOfToday } from 'date-fns';
import { Filter, Printer, RotateCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';

type TFilter = {
    startDate: string;
    endDate: string;
    type: 'categories_report' | 'categories_summary' | 'products_report';
    user_id: string;
    categories_id: number[];
};

interface Product {
    id: number;
    name: string;
    quantity: number;
    discount: number;
    tax_value: number;
    total_price: number;
    total_purchase_price: number;
    unit_price: number;
}

interface Category {
    id: number;
    name: string;
    products: Product[];
    total_tax_value: number;
    total_price: number;
    total_discount: number;
    total_sold_items: number;
    total_purchase_price: number;
}

type TData = {
    result: Category[];
    summary: {
        sales_discounts: number;
        product_taxes: number;
        sales_taxes: number;
        subtotal: number;
        shipping: number;
        profit: number;
        total_purchase_price: number;
        total: number;
    };
};

const reportTypes = [
    { value: 'categories_report', label: 'Categories Detailed' },
    { value: 'categories_summary', label: 'Categories Summary' },
    { value: 'products_report', label: 'Products Report' },
] as const;

const defaultData = {
    result: [],
    summary: {
        sales_discounts: 0,
        product_taxes: 0,
        sales_taxes: 0,
        subtotal: 0,
        shipping: 0,
        profit: 0,
        total_purchase_price: 0,
        total: 0,
    },
};

export default function SalesPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<TData>(defaultData);

    const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

    const [users, setUsers] = useState<User[]>([]);
    const [categories, setCategories] = useState<CategoryProduct[]>([]);
    const [selectCategories, setSelectCategories] = useState<CategoryProduct[]>([]);
    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfToday(), to: endOfToday() });
    const [filters, setFilters] = useState<TFilter>({
        endDate: format(endOfToday(), 'yyyy-MM-dd HH:mm:ss'),
        startDate: format(startOfToday(), 'yyyy-MM-dd HH:mm:ss'),
        categories_id: [],
        user_id: '',
        type: 'categories_report',
    });

    const getData = async (filters: TFilter) => {
        try {
            const data = await reportsApi.saleReport(filters);
            setData(data);
        } catch (error) {
            console.error('Error fetching Orders:', error);
        }
    };

    const getUsers = async () => {
        try {
            const users = await usersApi.getAll();
            setUsers(users);
        } catch (error) {
            console.error('Error fetching Orders:', error);
        }
    };

    const getCategories = async () => {
        try {
            const categories = await categoriesApi.getAll();
            setCategories(categories);
        } catch (error) {
            console.error('Error fetching Orders:', error);
        }
    };

    const calculateProfit = (totalPrice: number, purchasePrice: number) => {
        return totalPrice - purchasePrice;
    };

    const handleTypeChange = async (newType: 'categories_report' | 'categories_summary' | 'products_report') => {
        setData(defaultData);

        setFilters({ ...filters, type: newType });
        setIsTypeDialogOpen(false);

        getData({ ...filters, type: newType });
    };

    const handleUserChange = (newUser: string) => {
        setFilters({ ...filters, user_id: newUser });
        setIsUserDialogOpen(false);

        getData({ ...filters, user_id: newUser });
    };

    const handleCategoryToggle = (category: CategoryProduct) => {
        if (!category) return;

        const categoryExists = selectCategories.find((c) => c.id === category.id);
        if (categoryExists) {
            const newCategories = selectCategories.filter((c) => c.id !== category.id);
            setSelectCategories(newCategories);
            setFilters({ ...filters, categories_id: newCategories.map((c) => c.id) });
            getData({ ...filters, categories_id: newCategories.map((c) => c.id) });
        } else {
            const newCategories = [...selectCategories, category];
            setSelectCategories(newCategories);
            setFilters({ ...filters, categories_id: newCategories.map((c) => c.id) });
            getData({ ...filters, categories_id: newCategories.map((c) => c.id) });
        }
    };

    useEffect(() => {
        getData(filters);
    }, []);

    const renderTable = () => {
        switch (filters.type) {
            case 'categories_report':
                return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Category')}</TableHead>
                                <TableHead>{t('Product')}</TableHead>
                                <TableHead className="text-center">{t('Quantity')}</TableHead>
                                <TableHead className="text-center">{t('Discount')}</TableHead>
                                <TableHead className="text-center">{t('Taxes')}</TableHead>
                                <TableHead className="text-center">{t('Total')}</TableHead>
                                <TableHead className="text-center">{t('Purchase Price')}</TableHead>
                                <TableHead className="text-center">{t('Profit')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.result?.map((category) => (
                                <React.Fragment key={category.id}>
                                    {category?.products?.map((product, index) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="text-muted-foreground">{index === 0 ? category.name : ''}</TableCell>
                                            <TableCell>{product.name}</TableCell>
                                            <TableCell className="text-center">{product.quantity}</TableCell>
                                            <TableCell className="text-center">{formatCurrency(product.discount)}</TableCell>
                                            <TableCell className="text-center">{formatCurrency(product.tax_value)}</TableCell>
                                            <TableCell className="text-center">{formatCurrency(product.total_price)}</TableCell>
                                            <TableCell className="text-center">{formatCurrency(product.total_purchase_price)}</TableCell>
                                            <TableCell className="text-center">
                                                {formatCurrency(calculateProfit(product.total_price, product.total_purchase_price))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/50">
                                        <TableCell className="text-primary font-medium">{category.name}</TableCell>
                                        <TableCell></TableCell>
                                        <TableCell className="text-center font-medium">{category.total_sold_items}</TableCell>
                                        <TableCell className="text-center font-medium">{formatCurrency(category.total_discount)}</TableCell>
                                        <TableCell className="text-center font-medium">{formatCurrency(category.total_tax_value)}</TableCell>
                                        <TableCell className="text-primary text-center font-medium">{formatCurrency(category.total_price)}</TableCell>
                                        <TableCell className="text-center font-medium">{formatCurrency(category.total_purchase_price)}</TableCell>
                                        <TableCell className="text-center font-medium">
                                            {formatCurrency(calculateProfit(category.total_price, category.total_purchase_price))}
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                            <TableRow className="bg-muted/30 font-semibold">
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-center">{data.result.reduce((sum, cat) => sum + cat.total_sold_items, 0)}</TableCell>
                                <TableCell className="text-center">
                                    {formatCurrency(data.result.reduce((sum, cat) => sum + cat.total_discount, 0))}
                                </TableCell>
                                <TableCell className="text-center">
                                    {formatCurrency(data.result.reduce((sum, cat) => sum + cat.total_tax_value, 0))}
                                </TableCell>
                                <TableCell className="text-center">
                                    {formatCurrency(data.result.reduce((sum, cat) => sum + cat.total_price, 0))}
                                </TableCell>
                                <TableCell className="text-center">
                                    {formatCurrency(data.result.reduce((sum, cat) => sum + cat.total_purchase_price, 0))}
                                </TableCell>
                                <TableCell className="text-center">{formatCurrency(data.summary.profit)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                );

            case 'products_report':
                const allProducts = data.result as unknown as Product[];

                return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Products')}</TableHead>
                                <TableHead className="text-center">{t('Quantity')}</TableHead>
                                <TableHead className="text-center">{t('Discount')}</TableHead>
                                <TableHead className="text-center">{t('Cost')}</TableHead>
                                <TableHead className="text-center">{t('Taxes')}</TableHead>
                                <TableHead className="text-center">{t('Total')}</TableHead>
                                <TableHead className="text-center">{t('Profit')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allProducts?.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell className="text-center">{product.quantity}</TableCell>
                                    <TableCell className="text-center">{formatCurrency(product.discount)}</TableCell>
                                    <TableCell className="text-center">{formatCurrency(product.total_purchase_price)}</TableCell>
                                    <TableCell className="text-center">{formatCurrency(product.tax_value)}</TableCell>
                                    <TableCell className="text-center">{formatCurrency(product.total_price)}</TableCell>
                                    <TableCell className="text-center">
                                        {formatCurrency(calculateProfit(product.total_price, product.total_purchase_price))}
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-muted/30 font-semibold">
                                <TableCell>{t('Total')}</TableCell>
                                <TableCell className="text-center">{allProducts.reduce((sum, product) => sum + product.quantity, 0)}</TableCell>
                                <TableCell className="text-center">
                                    {formatCurrency(allProducts.reduce((sum, product) => sum + product.discount, 0))}
                                </TableCell>
                                <TableCell className="text-center">{formatCurrency(data.summary.total_purchase_price)}</TableCell>
                                <TableCell className="text-center">{formatCurrency(data.summary.product_taxes)}</TableCell>
                                <TableCell className="text-center">{formatCurrency(data.summary.subtotal)}</TableCell>
                                <TableCell className="text-center">{formatCurrency(data.summary.profit)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                );

            case 'categories_summary':
                return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Category')}</TableHead>
                                <TableHead className="text-center">{t('Quantity')}</TableHead>
                                <TableHead className="text-center">{t('Discount')}</TableHead>
                                <TableHead className="text-center">{t('Cost')}</TableHead>
                                <TableHead className="text-center">{t('Taxes')}</TableHead>
                                <TableHead className="text-center">{t('Total')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.result?.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="text-muted-foreground">{category.name}</TableCell>
                                    <TableCell className="text-center">{category.total_sold_items}</TableCell>
                                    <TableCell className="text-center">{formatCurrency(category.total_discount)}</TableCell>
                                    <TableCell className="text-center">{formatCurrency(category.total_purchase_price)}</TableCell>
                                    <TableCell className="text-center">{formatCurrency(category.total_tax_value)}</TableCell>
                                    <TableCell className="text-center">{formatCurrency(category.total_price)}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-muted/30 font-semibold">
                                <TableCell>{t('Total')}</TableCell>
                                <TableCell className="text-center">{data.result.reduce((sum, cat) => sum + cat.total_sold_items, 0)}</TableCell>
                                <TableCell className="text-center">
                                    {formatCurrency(data.result.reduce((sum, cat) => sum + cat.total_discount, 0))}
                                </TableCell>
                                <TableCell className="text-center">{formatCurrency(data.summary.total_purchase_price)}</TableCell>
                                <TableCell className="text-center">{formatCurrency(data.summary.product_taxes)}</TableCell>
                                <TableCell className="text-center">{formatCurrency(data.summary.subtotal)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                );

            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={[]}>
            <div className="min-h-screen p-4">
                <div className="rounded-lg shadow-sm">
                    {/* Header */}
                    <div className="rounded-t-lg px-6 py-4">
                        <h1 className="text-2xl font-semibold">{t('Sales Report')}</h1>
                        <p className="mt-1 text-sm">{t('Provides an overview over the sales during a specific period')}</p>
                    </div>

                    <div className="p-4">
                        {/* Date Range and Load Button */}
                        <div className="mb-6 flex items-center gap-4">
                            <div className="w-fit">
                                <DateRangePicker
                                    onDateRangeChange={(dateRange) => {
                                        if (!dateRange) return;
                                        setDateRange(dateRange);
                                        setFilters({
                                            ...filters,
                                            startDate: format(dateRange?.from!, 'yyyy-MM-dd HH:mm:ss'),
                                            endDate: format(dateRange?.to!.setHours(23, 59, 59), 'yyyy-MM-dd HH:mm:ss'),
                                        });
                                    }}
                                    dateRange={dateRange}
                                />
                            </div>
                            <Button onClick={() => getData(filters)} variant="outline" className="flex items-center gap-2 bg-transparent">
                                <RotateCcw className="h-4 w-4" />
                                {t('Load')}
                            </Button>
                        </div>

                        {/* Filter Buttons */}
                        <div className="mb-6 flex items-center gap-4">
                            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                <Printer className="h-4 w-4" />
                                {t('Print')}
                            </Button>

                            <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                        <Filter className="h-4 w-4" />
                                        {t('By Type')} : {t(reportTypes.find((rt) => rt.value === filters.type)?.label ?? '')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>{t('Select Report Type')}</DialogTitle>
                                        <DialogDescription>{t('Select the type of report you want to generate')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                        {reportTypes.map((reportType) => (
                                            <SelectableItem
                                                onChange={() => handleTypeChange(reportType.value)}
                                                label={t(reportType.label)}
                                                value={reportType.value}
                                                key={reportType.value}
                                                selected={filters.type === reportType.value}
                                            />
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog
                                open={isUserDialogOpen}
                                onOpenChange={(val) => {
                                    setIsUserDialogOpen(val);
                                    if (val) getUsers();
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                        <Filter className="h-4 w-4" />
                                        {t('By User')} :{' '}
                                        {filters.user_id !== '' ? users.find((u) => u.id === +filters.user_id)?.username : t('All Users')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>{t('Select User')}</DialogTitle>
                                        <DialogDescription>{t('Select a user to filter sales by user')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                        <SelectableItem
                                            onChange={(val) => handleUserChange(val === 'all-users' ? '' : 'value')}
                                            label={t('All Users')}
                                            value={'all-users'}
                                            selected={filters.user_id === ''}
                                        />
                                        {users.map((user) => (
                                            <SelectableItem
                                                onChange={(val) => handleUserChange(val)}
                                                label={user.username}
                                                value={user.id.toString()}
                                                key={user.id.toString()}
                                                selected={filters.user_id === user.id.toString()}
                                            />
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog
                                open={isCategoryDialogOpen}
                                onOpenChange={(val) => {
                                    setIsCategoryDialogOpen(val);
                                    if (val) getCategories();
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                        <Filter className="h-4 w-4" />
                                        {t('By Category')} : {selectCategories.map((c) => c.name).join(', ') || t('None')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>{t('Select Categories')}</DialogTitle>
                                        <DialogDescription>{t('Select categories to filter sales by category')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                        {categories.map((category) => (
                                            <SelectableItem
                                                onChange={() => handleCategoryToggle(category)}
                                                label={category.name}
                                                value={category.id.toString()}
                                                key={category.id.toString()}
                                                selected={filters.categories_id.includes(category.id)}
                                            />
                                        ))}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSelectCategories([]);
                                                setFilters({ ...filters, categories_id: [] });
                                            }}
                                        >
                                            {t('Clear')}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <SalesSummary summary={data.summary || defaultData.summary} />

                        {/* Detailed Products Table */}
                        <div className="overflow-hidden rounded-lg border">{renderTable()}</div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
