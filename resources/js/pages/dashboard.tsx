import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { Head, usePage } from '@inertiajs/react';
import { BarChart3, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

// Types for dashboard data
interface DashboardCard {
    total_sales_amount: number;
    total_orders: number;
    total_customers: number;
    total_products: number;
}

interface Customer {
    id: number;
    name: string;
    email: string;
    purchases_amount: number;
}

interface Order {
    id: number;
    code: string;
    total: number;
    created_at: string;
    user: {
        name: string;
    };
}

export default function Dashboard() {
    const { t } = useTranslation();
    const props = usePage().props;
    const [cards, setCards] = useState<DashboardCard | null>(null);
    const [bestCustomers, setBestCustomers] = useState<Customer[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [cardsResponse, customersResponse, weeksResponse, cashiersResponse, ordersResponse] = await Promise.all([
                    fetch('/api/dashboard/day').then((res) => res.json()),
                    fetch('/api/dashboard/best-customers').then((res) => res.json()),
                    fetch('/api/dashboard/weeks').then((res) => res.json()),
                    fetch('/api/dashboard/best-cashiers').then((res) => res.json()),
                    fetch('/api/dashboard/recent-orders').then((res) => res.json()),
                ]);

                // console.log("cardsResponse", cardsResponse);
                // console.log("customersResponse", customersResponse);
                // console.log("weeksResponse", weeksResponse);
                // console.log("cashiersResponse", cashiersResponse);
                console.log('ordersResponse', ordersResponse);

                setCards(cardsResponse);
                setBestCustomers(customersResponse);
                setRecentOrders(ordersResponse);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const breadcrumbs = [
        { title: t('home'), href: '/' },
        { title: t('dashboard'), href: '/dashboard' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Dashboard')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Dashboard Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Total Sales')}</CardTitle>
                            <DollarSign className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-28" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{formatCurrency(cards?.total_sales_amount || 0)}</div>
                                    <p className="text-muted-foreground text-xs">{t("Today's Sales")}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Orders')}</CardTitle>
                            <ShoppingCart className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{cards?.total_orders || 0}</div>
                                    <p className="text-muted-foreground text-xs">{t("Today's Orders")}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Customers')}</CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{cards?.total_customers || 0}</div>
                                    <p className="text-muted-foreground text-xs">{t("Today's Customers")}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Products')}</CardTitle>
                            <BarChart3 className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{cards?.total_products || 0}</div>
                                    <p className="text-muted-foreground text-xs">{t('Total Products')}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Best Customers and Recent Orders */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Best Customers */}
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>{t('Best Customers')}</CardTitle>
                            <CardDescription>{t('List of registered customers')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px]">
                                <div className="space-y-4">
                                    {loading ? (
                                        Array(5)
                                            .fill(0)
                                            .map((_, i) => (
                                                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-32" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                    <Skeleton className="h-4 w-16" />
                                                </div>
                                            ))
                                    ) : bestCustomers.length > 0 ? (
                                        bestCustomers.map((customer) => (
                                            <div key={customer.id} className="flex items-center justify-between rounded-lg border p-3">
                                                <div>
                                                    <p className="font-medium">{customer.name}</p>
                                                    <p className="text-muted-foreground text-sm">{customer.email}</p>
                                                </div>
                                                <div className="font-bold">{formatCurrency(customer.purchases_amount)}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <p>{t('No customers has been registered')}</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Recent Orders */}
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>{t('Recents Orders')}</CardTitle>
                            <CardDescription>{t('Manage all registered orders.')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px]">
                                <div className="space-y-4">
                                    {loading ? (
                                        Array(5)
                                            .fill(0)
                                            .map((_, i) => (
                                                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-24" />
                                                        <Skeleton className="h-3 w-40" />
                                                    </div>
                                                    <Skeleton className="h-4 w-16" />
                                                </div>
                                            ))
                                    ) : recentOrders.length > 0 ? (
                                        recentOrders.map((order) => (
                                            <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                                                <div>
                                                    <p className="font-medium">{order.code}</p>
                                                    <p className="text-muted-foreground text-sm">
                                                        {order.user?.name} • {formatDateTime(order.created_at)}
                                                    </p>
                                                </div>
                                                <div className="font-bold">{formatCurrency(order.total)}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <p>{t('No orders...')}</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
