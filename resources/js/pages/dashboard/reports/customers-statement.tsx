import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { SharedData } from '@/types';
import { formatCurrency } from '@/utils/format';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { endOfToday, format, startOfToday } from 'date-fns';
import { CreditCard, DollarSign, Printer, RotateCcw, Search, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';

type TFilter = {
    rangeEnds: string;
    rangeStarts: string;
};

interface CustomerStatement {
    purchases_amount: number;
    owed_amount: number;
    account_amount: number;
    total_orders: number;
    credit_limit_amount: number;
    orders: Order[];
    wallet_transactions: any[];
}

export default function Component() {
    const { t } = useTranslation();
    const { auth } = usePage<SharedData>().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerStatement, setCustomerStatement] = useState<CustomerStatement | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showCustomerList, setShowCustomerList] = useState(false);

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfToday(), to: endOfToday() });
    const [filters, setFilters] = useState<TFilter>({
        rangeEnds: format(endOfToday(), 'yyyy-MM-dd HH:mm:ss'),
        rangeStarts: format(startOfToday(), 'yyyy-MM-dd HH:mm:ss'),
    });

    const searchCustomers = async (query: string) => {
        if (!query.trim()) {
            setCustomers([]);
            setShowCustomerList(false);
            return;
        }

        setIsSearching(true);
        try {
            const { data } = await axios.post('/api/customers/search', { search: query });

            setCustomers(data);
            setShowCustomerList(true);
        } catch (error) {
            console.error('Error searching customers:', error);
        } finally {
            if (selectedCustomer) {
                loadCustomerStatement();
            }
            setIsSearching(false);
        }
    };

    const selectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setSearchQuery(`${customer.first_name} ${customer.last_name || ''}`.trim());
        setShowCustomerList(false);
        setCustomerStatement(null);
    };

    const loadCustomerStatement = async () => {
        if (!selectedCustomer) return;

        setIsLoading(true);
        try {
            const { data } = await axios.post(`/api/reports/customers-statement/${selectedCustomer.id}`, filters);
            setCustomerStatement(data);
        } catch (error) {
            console.error('Error loading customer statement:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            searchCustomers(searchQuery);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    return (
        <AppLayout breadcrumbs={[]}>
            <div className="min-h-screen p-4">
                <div className="rounded-lg shadow-sm">
                    <div className="rounded-t-lg px-6 py-4">
                        <h1 className="text-2xl font-semibold">{t('Customers Statement')}</h1>
                        <p className="mt-1 text-sm">{t('Display the complete customer statement.')}</p>
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
                                            rangeStarts: format(dateRange?.from!, 'yyyy-MM-dd HH:mm:ss'),
                                            rangeEnds: format(dateRange?.to!.setHours(23, 59, 59), 'yyyy-MM-dd HH:mm:ss'),
                                        });
                                    }}
                                    dateRange={dateRange}
                                />
                            </div>
                            <Button
                                onClick={() => loadCustomerStatement()}
                                disabled={!selectedCustomer}
                                variant="outline"
                                className="flex items-center gap-2 bg-transparent"
                            >
                                <RotateCcw className="h-4 w-4" />
                                {t('Load')}
                            </Button>
                            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                <Printer className="h-4 w-4" />
                                {t('Print')}
                            </Button>
                        </div>

                        <div className="relative mb-6">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder={t('Search Customer...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10"
                                />
                                {isSearching && (
                                    <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                                        <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
                                    </div>
                                )}
                            </div>

                            {showCustomerList && customers.length > 0 && (
                                <div className="absolute top-full right-0 left-0 z-10 max-h-60 overflow-y-auto rounded-md border bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                                    {customers.map((customer) => (
                                        <div
                                            key={customer.id}
                                            onClick={() => selectCustomer(customer)}
                                            className="cursor-pointer border-b p-3 last:border-b-0 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-600"
                                        >
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {customer.first_name} {customer.last_name}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {customer.email} • {customer.phone}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="text-muted-foreground mb-6 space-y-1 text-sm dark:text-gray-400">
                            <p>
                                <span className="font-medium">{t('Range')} :</span> {filters.rangeStarts} — {filters.rangeEnds}
                            </p>
                            <p>
                                <span className="font-medium">{t('Document')} :</span> {t('Customer Statement')}
                            </p>
                            <p>
                                <span className="font-medium">{t('Customer')} :</span>{' '}
                                {selectedCustomer ? `${selectedCustomer?.first_name} ${selectedCustomer?.last_name}` : t('N/A')}
                            </p>
                            <p>
                                <span className="font-medium">{t('By')} :</span> {auth.user.username}
                            </p>
                        </div>

                        <div className="mb-8">
                            <h3 className="mb-4 text-lg font-semibold">{t('Financial Summary')}</h3>
                            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-green-100 p-4 dark:border-green-800 dark:from-green-950/50 dark:to-green-900/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-green-700 dark:text-green-300">{t('Total Purchases')}</p>
                                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                                {formatCurrency(customerStatement?.purchases_amount || 0)}
                                            </p>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 dark:bg-green-600">
                                            <TrendingUp className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 p-4 dark:border-orange-800 dark:from-orange-950/50 dark:to-orange-900/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-orange-700 dark:text-orange-300">{t('Due Amount')}</p>
                                            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                                                {formatCurrency(Math.abs(customerStatement?.owed_amount || 0))}
                                            </p>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 dark:bg-orange-600">
                                            <DollarSign className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-4 dark:border-blue-800 dark:from-blue-950/50 dark:to-blue-900/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('Wallet Balance')}</p>
                                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                                {formatCurrency(customerStatement?.account_amount || 0)}
                                            </p>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600">
                                            <Wallet className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100 p-4 dark:border-purple-800 dark:from-purple-950/50 dark:to-purple-900/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">{t('Credit Limit')}</p>
                                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                                {formatCurrency(customerStatement?.credit_limit_amount || 0)}
                                            </p>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 dark:bg-purple-600">
                                            <CreditCard className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4 dark:border-gray-700 dark:from-gray-800/50 dark:to-gray-700/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('Total Orders')}</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {customerStatement?.total_orders || 0}
                                            </p>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-500 dark:bg-gray-600">
                                            <ShoppingBag className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {customerStatement && customerStatement.orders.length > 0 && (
                            <div className="overflow-hidden rounded-lg border">
                                <div className="bg-muted px-4 py-3">
                                    <h3 className="text-center text-lg font-semibold">{t('Orders')}</h3>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="dark:border-gray-700">
                                            <TableHead className="dark:text-gray-300">{t('Order')}</TableHead>
                                            <TableHead className="dark:text-gray-300">{t('Type')}</TableHead>
                                            <TableHead className="dark:text-gray-300">{t('Status')}</TableHead>
                                            <TableHead className="dark:text-gray-300">{t('Date')}</TableHead>
                                            <TableHead className="text-right dark:text-gray-300">{t('Total')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customerStatement.orders.map((order) => (
                                            <TableRow key={order.id} className="dark:border-gray-700">
                                                <TableCell className="font-medium text-gray-900 dark:text-gray-100">{order.code}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {order.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getPaymentStatusColor(order.payment_status)}>{order.payment_status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-600 dark:text-gray-400">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(order.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {!selectedCustomer && (
                            <div className="py-12 text-center">
                                <Search className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
                                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">{t('No Customer Selected')}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{t('Search and select a customer to view their statement.')}</p>
                            </div>
                        )}

                        {selectedCustomer && !customerStatement && isLoading && (
                            <div className="py-12 text-center">
                                <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
                                <p className="text-gray-500 dark:text-gray-400">{t('Loading customer statement...')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
