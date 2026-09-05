import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';
import { reportsApi } from '@/api';
import { endOfToday, format, startOfToday } from 'date-fns';
import { Minus, Printer, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';

type TFilter = {
    startDate: string;
    endDate: string;
    sort: 'using_quantity_asc' | 'using_quantity_desc' | 'using_sales_asc' | 'using_sales_desc' | 'using_name_asc' | 'using_name_desc';
};

interface Product {
    unit_name: string;
    product_id: number;
    name: string;
    quantity: number;
    total_price: number;
    tax_value: number;
    difference: number;
    old_total_price: number;
    old_quantity: number;
    evolution: 'progress' | 'regress' | 'stable';
}

interface PeriodData {
    startDate: string;
    endDate: string;
    products: Product[];
    total_price: number;
}

interface TData {
    previous: PeriodData;
    current: PeriodData;
}

const sortOptions = [
    { value: 'using_sales_asc', label: 'Using Sales Ascending' },
    { value: 'using_sales_desc', label: 'Using Sales Descending' },
    { value: 'using_quantity_asc', label: 'Using Quantity Ascending' },
    { value: 'using_quantity_desc', label: 'Using Quantity Descending' },
    { value: 'using_name_asc', label: 'Using Name Ascending' },
    { value: 'using_name_desc', label: 'Using Name Descending' },
];

const defaultData: TData = {
    previous: {
        startDate: '2024-09-28 00:00:01',
        endDate: '2025-03-03 00:00:00',
        products: [],
        total_price: 0,
    },
    current: {
        startDate: '2025-03-04 00:00:00',
        endDate: '2025-08-06 23:59:59',
        products: [],
        total_price: 0,
    },
};
export default function SalesPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<TData>(defaultData);
    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfToday(), to: endOfToday() });
    const [filters, setFilters] = useState<TFilter>({
        endDate: format(endOfToday(), 'yyyy-MM-dd HH:mm:ss'),
        startDate: format(startOfToday(), 'yyyy-MM-dd HH:mm:ss'),
        sort: 'using_sales_asc',
    });

    const getData = async (filters: TFilter) => {
        try {
            const data = await reportsApi.productsReport(filters);
            setData(data);
        } catch (error) {
            console.error('Error fetching Orders:', error);
        }
    };

    const getProgressIcon = (evolution: string) => {
        switch (evolution) {
            case 'progress':
                return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
            case 'regress':
                return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
            default:
                return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
        }
    };

    const getProgressColor = (evolution: string) => {
        switch (evolution) {
            case 'progress':
                return 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800';
            case 'regress':
                return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
            default:
                return 'bg-gray-50 border-gray-200 dark:bg-gray-800/30 dark:border-gray-700';
        }
    };

    const getProgressTextColor = (evolution: string) => {
        switch (evolution) {
            case 'progress':
                return 'text-green-700 dark:text-green-300';
            case 'regress':
                return 'text-red-700 dark:text-red-300';
            default:
                return 'text-gray-700 dark:text-gray-300';
        }
    };
    useEffect(() => {
        getData(filters);
    }, [filters]);

    return (
        <AppLayout breadcrumbs={[]}>
            <div className="min-h-screen p-4">
                <div className="rounded-lg shadow-sm">
                    {/* Header */}
                    <div className="rounded-t-lg px-6 py-4">
                        <h1 className="text-2xl font-semibold">{t('Sales Progress')}</h1>
                        <p className="mt-1 text-sm">{t('Provides an overview over the best products sold during a specific period.')}</p>
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
                                            startDate: format(dateRange.from ?? new Date(), 'yyyy-MM-dd HH:mm:ss'),
                                            endDate: format((dateRange.to ?? new Date()).setHours(23, 59, 59), 'yyyy-MM-dd HH:mm:ss'),
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

                            <Select value={filters.sort} onValueChange={(val) => setFilters({ ...filters, sort: val as TFilter['sort'] })}>
                                <SelectTrigger className="">
                                    <SelectValue placeholder={t('Choose an option')} />
                                </SelectTrigger>
                                <SelectContent className="">
                                    {sortOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value} className="">
                                            {t(option.label)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Products Table */}
                        <div className="overflow-hidden rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('Product')}</TableHead>
                                        <TableHead className="text-center">{t('Unit')}</TableHead>
                                        <TableHead className="text-center">{t('Quantity')}</TableHead>
                                        <TableHead className="text-center">{t('Value')}</TableHead>
                                        <TableHead className="text-center">{t('Progress')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.current.products.map((product, index) => (
                                        <TableRow
                                            key={`${product.product_id}-${product.unit_name}-${index}`}
                                            className={getProgressColor(product.evolution)}
                                        >
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-center">{product.unit_name}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-semibold">{product.quantity}</span>
                                                    {product.old_quantity > 0 && (
                                                        <span className={`text-xs ${getProgressTextColor(product.evolution)}`}>
                                                            +{product.quantity - product.old_quantity}
                                                        </span>
                                                    )}
                                                    {product.old_quantity === 0 && product.quantity > 0 && (
                                                        <span className="text-xs text-green-600">+{product.quantity}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-semibold">{formatCurrency(product.total_price)}</span>
                                                    {product.old_total_price === 0 && product.total_price > 0 && (
                                                        <span className="text-xs text-green-600">+{formatCurrency(product.total_price)}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`font-semibold ${getProgressTextColor(product.evolution)}`}>
                                                        {product.difference.toFixed(2)}%
                                                    </span>
                                                    {getProgressIcon(product.evolution)}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* Total Row */}
                                    <TableRow className="bg-muted/30 border-t-2 font-semibold">
                                        <TableCell colSpan={3}></TableCell>
                                        <TableCell className="text-center">{formatCurrency(data.current.total_price)}</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                        {/* Summary Cards */}
                        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-4 dark:border-blue-800 dark:from-blue-950/50 dark:to-blue-900/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Current Period')}</p>
                                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                            {formatCurrency(data.current.total_price)}
                                        </p>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4 dark:border-gray-700 dark:from-gray-800/50 dark:to-gray-700/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('Previous Period')}</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                            {formatCurrency(data.previous.total_price)}
                                        </p>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-500 dark:bg-gray-600">
                                        <Minus className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-green-100 p-4 dark:border-green-800 dark:from-green-950/50 dark:to-green-900/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-700 dark:text-green-300">{t('Growth')}</p>
                                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                            {data.previous.total_price === 0
                                                ? '∞'
                                                : `${(((data.current.total_price - data.previous.total_price) / data.previous.total_price) * 100).toFixed(1)}%`}
                                        </p>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 dark:bg-green-600">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
