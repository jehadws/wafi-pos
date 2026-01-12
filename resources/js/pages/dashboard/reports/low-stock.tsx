import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import SelectableItem from '@/components/ui/selectable-item';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { SharedData } from '@/types';
import { formatCurrency } from '@/utils/format';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Filter, Printer, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

type TFilter = {
    units: number[];
    categories: number[];
};

interface Product {
    id: number;
    name: string;
    tax_type: string;
    tax_group_id: number;
    tax_value: number;
    product_type: string;
    type: string;
    accurate_tracking: boolean;
    auto_cogs: boolean;
    status: string;
    stock_management: string;
    barcode: string;
    barcode_type: string;
    sku: string;
    description: string | null;
    thumbnail_id: string | null;
    category_id: number;
    parent_id: number;
    unit_group: number;
    on_expiration: string;
    expires: number;
    searchable: number;
    author: number;
    uuid: string | null;
    created_at: string;
    updated_at: string;
    unit_quantities: UnitQuantity[];
}

interface TData {
    current_page: number;
    data: Product[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

interface LowStockProduct {
    id: number;
    name: string;
}

interface LowStockRow {
    id: number;
    product_id: number;
    unit_id: number;
    quantity: number;
    low_quantity: number;
    sale_price_with_tax: number;
    product: LowStockProduct;
    unit: Unit;
}

const reportTypes: { value: 'stock-report' | 'low-stock-report'; label: string }[] = [
    { value: 'stock-report', label: 'Stock Report' },
    { value: 'low-stock-report', label: 'Low Stock Report' },
];

export default function SalesPage() {
    const { t } = useTranslation();
    const { auth } = usePage<SharedData>().props;
    const [data, setData] = useState<TData>({
        current_page: 0,
        data: [],
        first_page_url: '',
        from: 0,
        last_page: 0,
        last_page_url: '',
        links: [],
        next_page_url: '',
        path: '',
        per_page: 0,
        prev_page_url: '',
        to: 0,
        total: 0,
    });

    const [lowStockData, setLowStockData] = useState<LowStockRow[]>([]);
    const [reportType, setReportType] = useState<'low-stock-report' | 'stock-report'>('stock-report');

    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
    const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);

    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnits, setSelectedUnits] = useState<Unit[]>([]);
    const [categories, setCategories] = useState<CategoryProduct[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<CategoryProduct[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const [filters, setFilters] = useState<TFilter>({
        categories: [],
        units: [],
    });

    const getData = async (filters: TFilter) => {
        setIsLoading(true);
        try {
            if (reportType === 'low-stock-report') {
                const res = await axios.post('/api/reports/low-stock', filters);
                console.log('Data', res.data);
                setLowStockData(res.data);
            } else {
                const res = await axios.post('/api/reports/stock-report', filters);
                console.log('Data', res.data);
                setData(res.data);
            }
        } catch (error) {
            console.error('Error fetching Orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = async (page: number) => {
        if (reportType !== 'stock-report') return;
        if (page < 1 || page > data.last_page) return;
        setCurrentPage(page);
        await getData(filters);
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

    const handleTypeChange = async (newType: 'low-stock-report' | 'stock-report') => {
        setReportType(newType);
        setIsTypeDialogOpen(false);

        getData(filters);
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

    // Calculate totals for the table footer
    const totalQuantity =
        reportType === 'stock-report' ? data.data.reduce((sum, p) => sum + p.unit_quantities.reduce((us, u) => us + u.quantity, 0), 0) : 0;

    const totalOverallPrice =
        reportType === 'stock-report'
            ? data.data.reduce((sum, p) => sum + p.unit_quantities.reduce((us, u) => us + u.sale_price_with_tax * u.quantity, 0), 0)
            : 0;

    useEffect(() => {
        getData(filters);
    }, []);

    return (
        <AppLayout breadcrumbs={[]}>
            <div className="min-h-screen p-4">
                <div className="">
                    {/* Header */}
                    <div className="rounded-t-lg px-6 py-4">
                        <h1 className="text-2xl font-semibold">{t('Stock Report')}</h1>
                        <p className="mt-1 text-sm">{t('Provides an overview of the products stock')}</p>
                    </div>

                    <div className="p-4">
                        <div className="mb-6 flex items-center gap-4">
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
                            <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                        <Filter className="h-4 w-4" />
                                        {t('By Type')} : {reportTypes.find((t) => t.value === reportType)?.label}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>{t('Select Report Type')}</DialogTitle>
                                        <DialogDescription>{t('Select the type of report you want to generate')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                        {reportTypes.map((type) => (
                                            <SelectableItem
                                                onChange={() => handleTypeChange(type.value)}
                                                label={type.label}
                                                value={type.value}
                                                key={type.value}
                                                selected={reportType === type.value}
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
                        </div>

                        <div className="text-muted-foreground mb-6 space-y-1 text-sm dark:text-gray-400">
                            <p>
                                <span className="font-medium">{t('Range')} :</span> {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
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
                                    {reportType === 'stock-report' ? (
                                        <TableRow className="dark:border-gray-700">
                                            <TableHead className="dark:text-gray-300">{t('Product')}</TableHead>
                                            <TableHead className="text-center dark:text-gray-300">{t('Unit')}</TableHead>
                                            <TableHead className="text-center dark:text-gray-300">{t('Price')}</TableHead>
                                            <TableHead className="text-center dark:text-gray-300">{t('Quantity')}</TableHead>
                                            <TableHead className="text-center dark:text-gray-300">{t('Total Price')}</TableHead>
                                        </TableRow>
                                    ) : (
                                        <TableRow className="dark:border-gray-700">
                                            <TableHead className="dark:text-gray-300">{t('Product')}</TableHead>
                                            <TableHead className="text-center dark:text-gray-300">{t('Unit')}</TableHead>
                                            <TableHead className="text-center dark:text-gray-300">{t('Threshold')}</TableHead>
                                            <TableHead className="bg-blue-100 text-center font-medium dark:bg-blue-950/30">{t('Quantity')}</TableHead>
                                            <TableHead className="bg-green-100 text-center font-medium dark:bg-green-950/30">{t('Price')}</TableHead>
                                        </TableRow>
                                    )}
                                </TableHeader>

                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-8 text-center">
                                                <div className="flex items-center justify-center">
                                                    <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                                                    <span className="text-muted-foreground ml-2">{t('Loading report...')}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : reportType === 'stock-report' ? (
                                        <>
                                            {data.data.flatMap((product) =>
                                                product.unit_quantities.map((uq) => (
                                                    <TableRow key={`${product.id}-${uq.id}`} className="dark:border-gray-700">
                                                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">{product.name}</TableCell>
                                                        <TableCell className="text-center text-gray-800 dark:text-gray-200">{uq.unit.name}</TableCell>
                                                        <TableCell className="text-center text-gray-800 dark:text-gray-200">
                                                            {formatCurrency(uq.sale_price_with_tax)}
                                                        </TableCell>
                                                        <TableCell className="text-center text-gray-800 dark:text-gray-200">{uq.quantity}</TableCell>
                                                        <TableCell className="text-center text-gray-800 dark:text-gray-200">
                                                            {formatCurrency(uq.sale_price_with_tax * uq.quantity)}
                                                        </TableCell>
                                                    </TableRow>
                                                )),
                                            )}
                                            <TableRow className="bg-muted/30 border-t-2 font-semibold dark:border-gray-600 dark:bg-gray-700/30">
                                                <TableCell colSpan={3} className="text-gray-900 dark:text-gray-100"></TableCell>
                                                <TableCell className="text-center text-gray-900 dark:text-gray-100">{totalQuantity}</TableCell>
                                                <TableCell className="text-center text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(totalOverallPrice)}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <>
                                            {lowStockData.map((row) => {
                                                const totalPrice = row.sale_price_with_tax * row.quantity;
                                                return (
                                                    <TableRow key={row.id} className="dark:border-gray-700">
                                                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                                            {row.product.name}
                                                        </TableCell>
                                                        <TableCell className="text-center text-gray-800 dark:text-gray-200">
                                                            {row.unit.name}
                                                        </TableCell>
                                                        <TableCell className="text-center text-gray-800 dark:text-gray-200">
                                                            {row.low_quantity}
                                                        </TableCell>
                                                        <TableCell className="bg-blue-50 text-center text-gray-900 dark:bg-blue-950/20 dark:text-gray-100">
                                                            {row.quantity}
                                                        </TableCell>
                                                        <TableCell className="bg-green-50 text-center text-gray-900 dark:bg-green-950/20 dark:text-gray-100">
                                                            {formatCurrency(totalPrice)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {reportType === 'stock-report' && (
                            <div className="mt-4 flex items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || isLoading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {data.links
                                    .filter((link) => link.label !== '&laquo; Previous' && link.label !== 'Next &raquo;')
                                    .map((link) => (
                                        <Button
                                            key={link.label}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => handlePageChange(Number(link.label))}
                                            disabled={!link.url || isLoading}
                                            className={
                                                link.active
                                                    ? 'bg-primary dark:text-white'
                                                    : 'dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                            }
                                        >
                                            {link.label}
                                        </Button>
                                    ))}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === data.last_page || isLoading}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
