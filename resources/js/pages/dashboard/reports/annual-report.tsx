import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { SharedData } from '@/types';
import { formatCurrency } from '@/utils/format';
import { usePage } from '@inertiajs/react';
import { reportsApi } from '@/api';
import { Printer, RefreshCcw, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MonthData {
    id: number;
    month_taxes: number;
    month_unpaid_orders: number;
    month_unpaid_orders_count: number;
    month_paid_orders: number;
    month_paid_orders_count: number;
    month_partially_paid_orders: number;
    month_partially_paid_orders_count: number;
    month_income: number;
    month_discounts: number;
    month_wasted_goods_count: number;
    month_wasted_goods: number;
    month_expenses: number;
    total_wasted_goods: number;
    total_unpaid_orders: number;
    total_unpaid_orders_count: number;
    total_paid_orders: number;
    total_paid_orders_count: number;
    total_partially_paid_orders: number;
    total_partially_paid_orders_count: number;
    total_income: number;
    total_discounts: number;
    total_taxes: number;
    total_wasted_goods_count: number;
    total_expenses: number;
    month_of_year: number;
    range_starts: string;
    range_ends: string;
    created_at: string | null;
    updated_at: string | null;
}

interface AnnualReportData {
    [key: string]: MonthData;
}

export default function Component() {
    const { t } = useTranslation();
    const { auth } = usePage<SharedData>().props;
    const [selectedYear, setSelectedYear] = useState('2025');
    const [reportData, setReportData] = useState<AnnualReportData>({});
    const [isLoading, setIsLoading] = useState(false);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const getData = async () => {
        try {
            const data = await reportsApi.annualReport(selectedYear);
            setReportData(data);
        } catch (error) {
            console.error('Error fetching Orders:', error);
        }
    };

    const handleLoadReport = async () => {
        setIsLoading(true);
        await getData();
        setIsLoading(false);
    };

    const recomputeData = async () => {
        try {
            const result = await reportsApi.computeYearly(selectedYear);
            toast.success(result.message);
            if (result.success === 'success') {
                toast.success(result.message);
            }
        } catch (error) {
            console.error('Error Recomputing report:', error);
            toast.error('Failed to recompute report');
        }
    };

    // Calculate totals for the "Total" row
    const totalSales = Object.values(reportData).reduce((sum, month) => sum + month.month_paid_orders, 0);
    const totalTaxes = Object.values(reportData).reduce((sum, month) => sum + month.month_taxes, 0);
    const totalExpenses = Object.values(reportData).reduce((sum, month) => sum + month.month_expenses, 0);
    const totalIncome = Object.values(reportData).reduce((sum, month) => sum + month.month_income, 0);

    useEffect(() => {
        getData();
    }, []);

    return (
        <AppLayout breadcrumbs={[]}>
            <div className="min-h-screen p-4">
                <div className="rounded-lg shadow-sm">
                    {/* Header */}
                    <div className="rounded-t-lg px-6 py-4">
                        <h1 className="text-2xl font-semibold">{t('Annual Report')}</h1>
                        <p className="mt-1 text-sm">{t('Provides an overview over the sales during a specific period')}</p>
                    </div>

                    <div className="p-4">
                        {/* Year Input and Action Buttons */}
                        <div className="mb-6 flex items-center gap-4">
                            <Input type="number" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-32" />
                            <Button
                                variant="outline"
                                onClick={handleLoadReport}
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-transparent dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? t('Loading...') : t('Load')}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex items-center gap-2 bg-transparent dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <Printer className="h-4 w-4" />
                                {t('Print')}
                            </Button>
                            <Button
                                onClick={recomputeData}
                                variant="outline"
                                className="flex items-center gap-2 bg-transparent dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                {t('Recompute')}
                            </Button>
                        </div>

                        {/* Report Info */}
                        <div className="text-muted-foreground mb-6 space-y-1 text-sm dark:text-gray-400">
                            <p>
                                <span className="font-medium">{t('Date')} :</span> {new Date().toLocaleString()}
                            </p>
                            <p>
                                <span className="font-medium">{t('Document')} :</span> {t('Yearly Report')}
                            </p>
                            <p>
                                <span className="font-medium">{t('By')} :</span> {auth.user.username}
                            </p>
                        </div>

                        {/* Annual Report Table */}
                        <div className="overflow-hidden rounded-lg border dark:border-gray-700">
                            <Table>
                                <TableHeader>
                                    <TableRow className="dark:border-gray-700">
                                        <TableHead className="dark:text-gray-300"></TableHead> {/* Empty for Month column */}
                                        <TableHead className="text-center dark:text-gray-300">{t('Sales')}</TableHead>
                                        <TableHead className="text-center dark:text-gray-300">{t('Taxes')}</TableHead>
                                        <TableHead className="text-center dark:text-gray-300">{t('Expenses')}</TableHead>
                                        <TableHead className="text-center dark:text-gray-300">{t('Income')}</TableHead>
                                    </TableRow>
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
                                    ) : (
                                        <>
                                            {Object.values(reportData).map((month) => (
                                                <TableRow key={month.id} className="dark:border-gray-700">
                                                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                                        {monthNames[month.month_of_year - 1]}
                                                    </TableCell>
                                                    <TableCell className="text-center text-gray-800 dark:text-gray-200">
                                                        {formatCurrency(month.month_paid_orders)}
                                                    </TableCell>
                                                    <TableCell className="text-center text-gray-800 dark:text-gray-200">
                                                        {formatCurrency(month.month_taxes)}
                                                    </TableCell>
                                                    <TableCell className="text-center text-gray-800 dark:text-gray-200">
                                                        {formatCurrency(month.month_expenses)}
                                                    </TableCell>
                                                    <TableCell className="text-center text-gray-800 dark:text-gray-200">
                                                        {formatCurrency(month.month_income)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {/* Total Row */}
                                            <TableRow className="bg-muted/30 border-t-2 font-semibold dark:border-gray-600 dark:bg-gray-700/30">
                                                <TableCell className="text-gray-900 dark:text-gray-100">{t('Total')}</TableCell>
                                                <TableCell className="text-center text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(totalSales)}
                                                </TableCell>
                                                <TableCell className="text-center text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(totalTaxes)}
                                                </TableCell>
                                                <TableCell className="text-center text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(totalExpenses)}
                                                </TableCell>
                                                <TableCell className="text-center text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(totalIncome)}
                                                </TableCell>
                                            </TableRow>
                                        </>
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
