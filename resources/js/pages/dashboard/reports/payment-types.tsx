import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { SharedData } from '@/types';
import { formatCurrency } from '@/utils/format';
import { usePage } from '@inertiajs/react';
import { reportsApi } from '@/api';
import { endOfToday, format, startOfToday } from 'date-fns';
import { Printer, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';

type TFilter = {
    endDate: string;
    startDate: string;
};

type TData = {
    total: number;
    summary: TSummary[];
};

type TSummary = {
    total: number;
    label: string;
};

const defaultData = {
    total: 0,
    summary: [],
};

export default function Component() {
    const { t } = useTranslation();
    const { auth } = usePage<SharedData>().props;
    const [data, setData] = useState<TData>(defaultData);
    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfToday(), to: endOfToday() });
    const [filters, setFilters] = useState<TFilter>({
        endDate: format(endOfToday(), 'yyyy-MM-dd HH:mm:ss'),
        startDate: format(startOfToday(), 'yyyy-MM-dd HH:mm:ss'),
    });

    const getData = async (filters: TFilter) => {
        try {
            const data = await reportsApi.paymentTypes(filters);
            setData(data);
        } catch (error) {
            console.error('Error fetching Orders:', error);
        }
    };

    useEffect(() => {
        getData(filters);
    }, [filters]);

    return (
        <AppLayout breadcrumbs={[]}>
            <div className="min-h-screen p-6">
                <div className="rounded-lg shadow-sm">
                    {/* Header */}
                    <div className="rounded-t-lg py-6">
                        <h1 className="text-2xl font-semibold">{t('Sales By Payment Types')}</h1>
                        <p className="mt-1 text-sm">{t('Provide a report of the sales by payment types, for a specific period')}</p>
                    </div>

                    <div className="">
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
                    </div>

                    {/* Report Info - Only show when customer is selected */}
                    <div className="text-muted-foreground mb-6 space-y-1 text-sm dark:text-gray-400">
                        <p>
                            <span className="font-medium">{t('Range')} :</span> {filters.startDate} — {filters.endDate}
                        </p>
                        <p>
                            <span className="font-medium">{t('Document')} :</span> {t('Customer Statement')}
                        </p>
                        <p>
                            <span className="font-medium">{t('By')} :</span> {auth.user.username}
                        </p>
                        <p>
                            <span className="font-medium">{t('Document')} :</span> {t('Customer Statement')}
                        </p>
                        <p>
                            <span className="font-medium">{t('By')} :</span> {auth.user.username}
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow className="dark:border-gray-700">
                                    <TableHead className="dark:text-gray-300">{t('Summary')}</TableHead>
                                    <TableHead className="text-end dark:text-gray-300">{t('Total')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.summary.map((payment, i) => (
                                    <TableRow key={i} className="dark:border-gray-700">
                                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">{payment.label}</TableCell>
                                        <TableCell className="text-end font-medium text-blue-600 dark:text-blue-400">
                                            {formatCurrency(payment.total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow key={'total'} className="dark:border-gray-700">
                                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">{t('Total')}</TableCell>
                                    <TableCell className="text-end font-medium text-blue-600 dark:text-blue-400">
                                        {formatCurrency(data.total)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
