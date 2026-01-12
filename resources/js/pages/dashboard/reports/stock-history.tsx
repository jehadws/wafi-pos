import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import SelectableItem from '@/components/ui/selectable-item';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { Filter, Printer, RefreshCw, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type TData = {
    id: number;
    product_id: number;
    type: string;
    preview_url: string;
    expiration_date: string | null;
    unit_id: number;
    barcode: string;
    quantity: number;
    low_quantity: number;
    stock_alert_enabled: number;
    sale_price: number;
    sale_price_edit: number;
    sale_price_without_tax: number;
    sale_price_with_tax: number;
    sale_price_tax: number;
    wholesale_price: number;
    wholesale_price_edit: number;
    wholesale_price_with_tax: number;
    wholesale_price_without_tax: number;
    wholesale_price_tax: number;
    custom_price: number;
    custom_price_edit: number;
    custom_price_with_tax: number;
    custom_price_without_tax: number;
    custom_price_tax: number;
    visible: number;
    convert_unit_id: number | null;
    cogs: number;
    uuid: string | null;
    created_at: string;
    updated_at: string;
    product_category_id: number;
    unit_name: string;
    history_date: string;
    history_initial_quantity: number;
    history_procured_quantity: number;
    history_defective_quantity: number;
    history_sold_quantity: number;
    history_final_quantity: number;
    history_unit_id: number;
    history_product_id: number;
    history_name: string;
}[];

type TFilter = {
    date: string;
    units: number[];
    categories: number[];
};

export default function Component() {
    const { t } = useTranslation();
    const { auth } = usePage<SharedData>().props;
    const [data, setData] = useState<TData>([]);

    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);

    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnits, setSelectedUnits] = useState<Unit[]>([]);
    const [categories, setCategories] = useState<CategoryProduct[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<CategoryProduct[]>([]);

    const [isLoading, setIsLoading] = useState(false);

    const [filters, setFilters] = useState<TFilter>({
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        categories: [],
        units: [],
    });

    const getData = async (filters: TFilter) => {
        setIsLoading(true);
        try {
            const res = await axios.post('/api/reports/product-history-combined', filters);
            console.log('Data', res.data);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching Orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateReport = async () => {
        try {
            const res = await axios.post('/api/reports/compute-combined-report', filters);
            if (res.data.status === 'success') {
                toast.success(res.data.message);
            }
        } catch (error) {
            console.error('Error fetching Orders:', error);
            // toast.error(error.response.data.message)
        }
    };

    const getUnits = async () => {
        try {
            const res = await axios.get('/api/units');
            setUnits(res.data);
            console.log('units', res.data);
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const getCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
            console.log('Categories', res.data);
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
    }, []);

    return (
        <AppLayout breadcrumbs={[]}>
            <div className="min-h-screen p-4">
                <div className="rounded-lg shadow-sm">
                    {/* Header */}
                    <div className="rounded-t-lg px-6 py-4">
                        <h1 className="text-2xl font-semibold">{t('Combined Report')}</h1>
                        <p className="mt-1 text-sm">{t('Provides a combined report for every transactions on products')}</p>
                    </div>

                    <div className="p-4">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="w-fit">
                                <DatePicker
                                    onDateChange={(dateRange) => {
                                        if (!dateRange) return;
                                        setDate(dateRange);
                                        setFilters({ ...filters, date: format(dateRange, 'yyyy-MM-dd HH:mm:ss') });
                                    }}
                                    date={date}
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
                                        {t('Unit:')} {selectedUnits.map((c) => c.name).join(', ') || t('None')}
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
                                            Clear
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Button variant="outline" onClick={() => generateReport()} className="flex items-center gap-2 bg-transparent">
                                <RefreshCw className="h-4 w-4" />
                                {t('Generate Report')}
                            </Button>
                        </div>

                        {/* Meta */}
                        <div className="text-muted-foreground mb-6 space-y-1 text-sm dark:text-gray-400">
                            <p>
                                <span className="font-medium">{t('Date')} :</span> {filters.date}
                            </p>
                            <p>
                                <span className="font-medium">{t('Document')} :</span> {t('Combined Products History')}
                            </p>
                            <p>
                                <span className="font-medium">{t('By')} :</span> {auth.user.username}
                            </p>
                        </div>

                        {/* Table */}
                        <div className="overflow-hidden rounded-lg border dark:border-gray-700">
                            <Table>
                                <TableHeader>
                                    <TableRow className="dark:border-gray-700">
                                        <TableHead className="dark:text-gray-300">{t('Name')}</TableHead>
                                        <TableHead className="text-center dark:text-gray-300">{t('Initial Quantity')}</TableHead>
                                        <TableHead className="text-center dark:text-gray-300">{t('Added Quantity')}</TableHead>
                                        <TableHead className="text-center dark:text-gray-300">{t('Sold Quantity')}</TableHead>
                                        <TableHead className="text-center dark:text-gray-300">{t('Defective Quantity')}</TableHead>
                                        <TableHead className="text-center dark:text-gray-300">{t('Final Quantity')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-8 text-center">
                                                <div className="flex items-center justify-center">
                                                    <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                                                    <span className="text-muted-foreground ml-2">{t('Generating...')}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                                                {t('No data for the selected date and filters')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((r) => (
                                            <TableRow key={`${r.id}-${r.product_id}-${r.unit_id}`} className="dark:border-gray-700">
                                                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                                    {r.history_name} ({r.unit_name})
                                                </TableCell>
                                                <TableCell className="text-center text-gray-800 dark:text-gray-200">
                                                    {r.history_initial_quantity}
                                                </TableCell>
                                                <TableCell className="text-center text-gray-800 dark:text-gray-200">
                                                    {r.history_procured_quantity}
                                                </TableCell>
                                                <TableCell className="text-center text-gray-800 dark:text-gray-200">
                                                    {r.history_sold_quantity}
                                                </TableCell>
                                                <TableCell className="text-center text-gray-800 dark:text-gray-200">
                                                    {r.history_defective_quantity}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${
                                                        r.history_final_quantity < 0
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-gray-800 dark:text-gray-200'
                                                    }`}
                                                >
                                                    {r.history_final_quantity}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
