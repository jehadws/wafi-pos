import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import SelectableItem from '@/components/ui/selectable-item';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { SharedData } from '@/types';
import { formatCurrency } from '@/utils/format';
import { usePage } from '@inertiajs/react';
import { categoriesApi, reportsApi, unitsApi } from '@/api';
import { endOfToday, format, startOfToday } from 'date-fns';
import { Filter, Printer, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';

type TFilter = {
    startDate: string;
    endDate: string;
    units: number[];
    categories: number[];
};

type TData = {
    name: string;
    unit_name: string;
    mode: null | string;
    unit_price: number;
    quantity: number;
    tax_value: number;
    total_price: number;
}[];

export default function SalesPage() {
    const { t } = useTranslation();
    const { auth } = usePage<SharedData>().props;
    const [data, setData] = useState<TData>([]);

    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);

    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnits, setSelectedUnits] = useState<Unit[]>([]);
    const [categories, setCategories] = useState<CategoryProduct[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<CategoryProduct[]>([]);
    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfToday(), to: endOfToday() });
    const [filters, setFilters] = useState<TFilter>({
        endDate: format(endOfToday(), 'yyyy-MM-dd HH:mm:ss'),
        startDate: format(startOfToday(), 'yyyy-MM-dd HH:mm:ss'),
        categories: [],
        units: [],
    });

    const getData = async (filters: TFilter) => {
        try {
            const data = await reportsApi.soldStockReport(filters);
            setData(data);
        } catch (error) {
            console.error('Error fetching Orders:', error);
        }
    };

    const getUnits = async () => {
        try {
            const units = await unitsApi.getAll();
            setUnits(units);
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const getCategories = async () => {
        try {
            const categories = await categoriesApi.getAll();
            setCategories(categories);
        } catch (error) {
            console.error('Error fetching Categories:', error);
        }
    };

    const handleCategoryToggle = (category: CategoryProduct) => {
        if (!category) return;

        const categoryExists = selectedCategories.find((c) => c.id === category.id);
        if (categoryExists) {
            const newCategories = selectedCategories.filter((c) => c.id !== category.id);
            setSelectedCategories(newCategories);
            setFilters({ ...filters, categories: newCategories.map((c) => c.id) });
            getData({ ...filters, categories: newCategories.map((c) => c.id) });
        } else {
            const newCategories = [...selectedCategories, category];
            setSelectedCategories(newCategories);
            setFilters({ ...filters, categories: newCategories.map((c) => c.id) });
            getData({ ...filters, categories: newCategories.map((c) => c.id) });
        }
    };

    const handleUnitToggle = (unit: Unit) => {
        if (!unit) return;

        const unitExists = selectedUnits.find((c) => c.id === unit.id);
        if (unitExists) {
            const newUnits = selectedUnits.filter((c) => c.id !== unit.id);
            setSelectedUnits(newUnits);
            setFilters({ ...filters, units: newUnits.map((c) => c.id) });
            getData({ ...filters, units: newUnits.map((c) => c.id) });
        } else {
            const newUnits = [...selectedUnits, unit];
            setSelectedUnits(newUnits);
            setFilters({ ...filters, units: newUnits.map((c) => c.id) });
            getData({ ...filters, units: newUnits.map((c) => c.id) });
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
                        <h1 className="text-2xl font-semibold">{t('Sold Stock')}</h1>
                        <p className="mt-1 text-sm">{t('Provides an overview over the sold stock during a specific period.')}</p>
                    </div>

                    <div className="p-4">
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
                            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                <Printer className="h-4 w-4" />
                                {t('Print')}
                            </Button>
                        </div>

                        {/* Filter Buttons */}
                        <div className="mb-6 flex items-center gap-4">
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
                                        {t('By Category')} : {selectedCategories.map((c) => c.name).join(', ') || t('None')}
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
                                                selected={filters.categories.includes(category.id)}
                                            />
                                        ))}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedCategories([]);
                                                setFilters({ ...filters, categories: [] });
                                            }}
                                        >
                                            {t('Clear')}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog
                                open={isUnitDialogOpen}
                                onOpenChange={(val) => {
                                    setIsUnitDialogOpen(val);
                                    if (val) getUnits();
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                        <Filter className="h-4 w-4" />
                                        {t('Unit')} : {selectedUnits.map((c) => c.name).join(', ') || t('None')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>{t('Select Units')}</DialogTitle>
                                        <DialogDescription>{t('Select units to filter sales by unit')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                        {units.map((unit) => (
                                            <SelectableItem
                                                onChange={() => handleUnitToggle(unit)}
                                                label={unit.name}
                                                value={unit.id.toString()}
                                                key={unit.id.toString()}
                                                selected={filters.units.includes(unit.id)}
                                            />
                                        ))}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedCategories([]);
                                                setFilters({ ...filters, units: [] });
                                            }}
                                        >
                                            {t('Clear')}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="text-muted-foreground mb-6 space-y-1 text-sm dark:text-gray-400">
                            <p>
                                <span className="font-medium">{t('Range')} :</span> {filters.startDate} — {filters.endDate}
                            </p>
                            <p>
                                <span className="font-medium">{t('Document')} :</span> {t('Sold Stock Report')}
                            </p>
                            <p>
                                <span className="font-medium">{t('By')} :</span> {auth.user.username}
                            </p>
                        </div>

                        {/* Detailed Products Table */}
                        <div className="overflow-hidden rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="">{t('Product')}</TableHead>
                                        <TableHead className="text-center">{t('Unit')}</TableHead>
                                        <TableHead className="text-center">{t('Quantity')}</TableHead>
                                        <TableHead className="text-center">{t('Taxes')}</TableHead>
                                        <TableHead className="text-center">{t('Total')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.map((product) => (
                                        <TableRow key={product.name}>
                                            <TableCell>{product.name}</TableCell>
                                            <TableCell className="text-center">{product.unit_name}</TableCell>
                                            <TableCell className="text-center">{product.quantity}</TableCell>
                                            <TableCell className="text-center">{formatCurrency(product.tax_value)}</TableCell>
                                            <TableCell className="text-center">{formatCurrency(product.total_price)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/30 font-semibold">
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                        <TableCell className="text-center">{data.reduce((sum, product) => sum + product.quantity, 0)}</TableCell>
                                        <TableCell className="text-center">
                                            {formatCurrency(data.reduce((sum, product) => sum + product.tax_value, 0))}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {formatCurrency(data.reduce((sum, product) => sum + product.total_price, 0))}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
