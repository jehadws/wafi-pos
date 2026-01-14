import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';
import axios from 'axios';
import { endOfToday, format, startOfToday } from 'date-fns';
import { ArrowRight, Printer, RotateCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';

interface TransactionAccount {
    name: string;
    debits: number;
    credits: number;
}

interface AccountCategory {
    transactions: TransactionAccount[];
    name: string;
    debits: number;
    credits: number;
}

interface TransactionsReportData {
    accounts: {
        assets: AccountCategory;
        liabilities: AccountCategory;
        equity: AccountCategory;
        revenues: AccountCategory;
        expenses: AccountCategory;
    };
    debits: number;
    credits: number;
    profit: number;
}

type TFilter = {
    startDate: string;
    endDate: string;
};

export default function Component() {
    const { t } = useTranslation();
    const [Data, setData] = useState<TransactionsReportData | null>();
    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfToday(), to: endOfToday() });
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState<TFilter>({
        endDate: format(endOfToday(), 'yyyy-MM-dd HH:mm:ss'),
        startDate: format(startOfToday(), 'yyyy-MM-dd HH:mm:ss'),
    });

    const getData = async (filters: TFilter) => {
        setIsLoading(true);
        try {
            const res = await axios.post('/api/reports/transactions', filters);
            console.log('Data', res.data);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching Orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const accountCategories = Object.values(Data?.accounts || {}) as AccountCategory[];

    useEffect(() => {
        getData(filters);
    }, []);

    return (
        <AppLayout breadcrumbs={[]}>
            <div className="min-h-screen p-4">
                <div className="rounded-lg shadow-sm">
                    {/* Header */}
                    <div className="rounded-t-lg p-4">
                        <h1 className="text-2xl font-semibold">{t('Transactions Report')}</h1>
                        <p className="mt-1 text-sm">{t('Provides an overview on the activity for a specific period.')}</p>
                    </div>

                    <div className="p-4">
                        {/* Date Range and Load Button */}
                        <div className="mb-4 flex items-center gap-4">
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
                            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                <Printer className="h-4 w-4" />
                                {t('Print')}
                            </Button>
                            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                <Printer className="h-4 w-4" />
                                {t('Print')}
                            </Button>
                        </div>
                        <div className="text-muted-foreground mb-6 space-y-1 text-sm dark:text-gray-400">
                            <p>
                                <span className="font-medium">{t('Range')} :</span> {filters.startDate} — {filters.endDate}
                            </p>
                            <p>
                                <span className="font-medium">{t('Document')} :</span> {t('Sale By Payment')}
                            </p>
                            <p>
                                <span className="font-medium">{t('By')} :</span> jehad
                            </p>
                        </div>
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="dark:border-gray-700">
                                        <TableHead className="dark:text-gray-300">{t('Account')}</TableHead>
                                        <TableHead className="text-right font-semibold text-red-800 dark:text-red-400">{t('Debit')}</TableHead>
                                        <TableHead className="text-right font-semibold text-green-800 dark:text-green-400">{t('Credit')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-8 text-center">
                                                <div className="flex items-center justify-center">
                                                    <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                                                    <span className="text-muted-foreground ml-2">{t('Loading report...')}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <>
                                            {accountCategories.map((category) => (
                                                <React.Fragment key={category.name}>
                                                    <TableRow className="bg-muted">
                                                        <TableCell className="flex items-center gap-2">
                                                            <ArrowRight className="h-4 w-4" />
                                                            {category.name}
                                                        </TableCell>
                                                        <TableCell className="text-right text-red-800 dark:text-red-400">
                                                            {formatCurrency(category.debits)}
                                                        </TableCell>
                                                        <TableCell className="text-right text-green-800 dark:text-green-400">
                                                            {formatCurrency(category.credits)}
                                                        </TableCell>
                                                    </TableRow>
                                                    {category.transactions.map((transaction, index) => (
                                                        <TableRow key={`${category.name}-${index}`} className="dark:border-gray-700">
                                                            <TableCell className="pl-8 text-gray-800 dark:text-gray-200">
                                                                {transaction.name}
                                                            </TableCell>
                                                            <TableCell className="text-right text-gray-800 dark:text-gray-200">
                                                                {formatCurrency(transaction.debits)}
                                                            </TableCell>
                                                            <TableCell className="text-right text-gray-800 dark:text-gray-200">
                                                                {formatCurrency(transaction.credits)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                            {/* Total Row */}
                                            <TableRow className="bg-muted/30 border-t-2 font-semibold dark:border-gray-600 dark:bg-gray-700/30">
                                                <TableCell className="text-gray-900 dark:text-gray-100">{t('Total')}</TableCell>
                                                <TableCell className="text-right text-red-800 dark:text-red-400">
                                                    {formatCurrency(Data?.debits || 0)}
                                                </TableCell>
                                                <TableCell className="text-right text-green-800 dark:text-green-400">
                                                    {formatCurrency(Data?.credits || 0)}
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
