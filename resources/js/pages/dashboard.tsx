import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { Head, usePage } from '@inertiajs/react';
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Award,
  Package,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SharedData } from '@/types';

// ─── Role namespaces ────────────────────────────────────────────────────────
const ROLE_ADMIN = 'admin';
const ROLE_STORE_ADMIN = 'subul.store.administrator';

// ─── Types ──────────────────────────────────────────────────────────────────
interface DashboardCard {
  total_sales_amount: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  day_expenses?: number;
}

interface Customer {
  id: number;
  username: string;
  name?: string;
  email: string;
  purchases_amount: number;
}

interface Cashier {
  id: number;
  username: string;
  email: string;
  total_sales: number;
  total_sales_count: number;
}

interface Order {
  id: number;
  code: string;
  total: number;
  payment_status: string;
  created_at: string;
  user?: { username: string; name?: string };
}

interface WeekDay {
  label: string;
  value: string;
  current?: { entries: { total_sales_amount: number }[] };
  previous?: { entries: { total_sales_amount: number }[] };
}

interface WeekData {
  range_starts: string;
  range_ends: string;
  result: Record<string, WeekDay>;
}

interface DashboardData {
  cards: DashboardCard | null;
  bestCustomers: Customer[];
  recentOrders: Order[];
  bestCashiers: Cashier[];
  weeks: WeekData | null;
  isElevated: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function initials(name: string): string {
  return name
    .split(/[\s._@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function paymentStatusMeta(status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (status) {
    case 'paid':
      return { label: 'Paid', variant: 'default' };
    case 'partially_paid':
      return { label: 'Partial', variant: 'secondary' };
    case 'unpaid':
      return { label: 'Unpaid', variant: 'destructive' };
    case 'refunded':
      return { label: 'Refunded', variant: 'outline' };
    case 'order_void':
      return { label: 'Void', variant: 'outline' };
    case 'due':
      return { label: 'Due', variant: 'destructive' };
    default:
      return { label: status, variant: 'secondary' };
  }
}

/** Build chart-friendly data from weekly API response */
function buildChartData(weeks: WeekData | null) {
  if (!weeks) return [];
  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon→Sun
  return order.map((dayIdx) => {
    const day = weeks.result[dayIdx];
    if (!day) return null;
    const current =
      day.current?.entries?.reduce((s, e) => s + (e.total_sales_amount ?? 0), 0) ?? 0;
    const previous =
      day.previous?.entries?.reduce((s, e) => s + (e.total_sales_amount ?? 0), 0) ?? 0;
    return { name: day.value, label: day.label, current, previous };
  }).filter(Boolean) as { name: string; label: string; current: number; previous: number }[];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  loading,
  trend,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  loading: boolean;
  trend?: number; // positive = up, negative = down
}) {
  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              {trend !== undefined && trend !== 0 && (
                <span className={trend > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                  {trend > 0 ? (
                    <TrendingUp className="inline h-3 w-3" />
                  ) : (
                    <TrendingDown className="inline h-3 w-3" />
                  )}
                </span>
              )}
              {sub}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AvatarBadge({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const colors = [
    'bg-violet-500',
    'bg-sky-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  const colorIdx = (name.charCodeAt(0) ?? 0) % colors.length;
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';
  return (
    <div
      className={`${colors[colorIdx]} ${sizeClass} flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white`}
    >
      {initials(name)}
    </div>
  );
}

function SectionSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex h-40 flex-col items-center justify-center gap-2 text-sm">
      <Package className="h-8 w-8 opacity-30" />
      <span>{message}</span>
    </div>
  );
}

// ─── Custom chart tooltip ────────────────────────────────────────────────────
function WeekTooltip({ active, payload, label }: any) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border-border rounded-lg border p-3 text-sm shadow-lg">
      <p className="font-semibold">{label}</p>
      <p className="text-primary mt-1">
        {t('This week')}: <strong>{formatCurrency(payload[0]?.value ?? 0)}</strong>
      </p>
      <p className="text-muted-foreground">
        {t('Last week')}: <strong>{formatCurrency(payload[1]?.value ?? 0)}</strong>
      </p>
    </div>
  );
}

// ─── Main Dashboard Page ─────────────────────────────────────────────────────
export default function Dashboard() {
  const { t } = useTranslation();
  const { auth } = usePage<SharedData>().props;
  const roles = auth?.roles ?? [];
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isElevated =
    roles.includes(ROLE_ADMIN) || roles.includes(ROLE_STORE_ADMIN) || Boolean(data?.isElevated);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/all');
        if (!response.ok) throw new Error('Failed to fetch');
        const json = await response.json();
        setData(json);
      } catch {
        setError(true);
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

  const cards = data?.cards ?? null;
  const chartData = buildChartData(data?.weeks ?? null);

  // Compute current-week total vs previous-week total for trend
  const currentWeekTotal = chartData.reduce((s, d) => s + d.current, 0);
  const previousWeekTotal = chartData.reduce((s, d) => s + d.previous, 0);
  const weekTrend = previousWeekTotal > 0 ? currentWeekTotal - previousWeekTotal : 0;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('Dashboard')} />

      <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

        {/* ── Error state ── */}
        {error && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
            {t('Failed to load dashboard data. Please refresh the page.')}
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Sales — admin/store-admin only */}
          {isElevated && (
            <StatCard
              title={t('Total Sales')}
              value={formatCurrency(cards?.total_sales_amount ?? 0)}
              sub={t("Today's revenue")}
              icon={DollarSign}
              loading={loading}
              trend={weekTrend}
            />
          )}

          {/* Orders */}
          <StatCard
            title={t('Orders')}
            value={cards?.total_orders ?? data?.recentOrders?.length ?? 0}
            sub={isElevated ? t("Today's orders") : t('Your recent orders')}
            icon={ShoppingCart}
            loading={loading}
          />

          {/* Customers — admin/store-admin only */}
          {isElevated && (
            <StatCard
              title={t('Customers')}
              value={cards?.total_customers ?? 0}
              sub={t('Registered customers')}
              icon={Users}
              loading={loading}
            />
          )}

          {/* Products */}
          <StatCard
            title={t('Products')}
            value={cards?.total_products ?? 0}
            sub={t('Total products')}
            icon={BarChart3}
            loading={loading}
          />

          {/* Expenses — admin/store-admin only */}
          {isElevated && (
            <StatCard
              title={t('Expenses')}
              value={formatCurrency(cards?.day_expenses ?? 0)}
              sub={t("Today's expenses")}
              icon={TrendingDown}
              loading={loading}
            />
          )}
        </div>

        {/* ── Weekly chart (elevated only) ── */}
        {isElevated && (
          <Card>
            <CardHeader>
              <CardTitle>{t('Weekly Sales')}</CardTitle>
              <CardDescription>
                {t('Current week vs previous week — by day')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[220px] w-full rounded-lg" />
              ) : chartData.length === 0 ? (
                <EmptyState message={t('No weekly data yet')} />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => formatCurrency(v)}
                      width={70}
                      className="fill-muted-foreground"
                    />
                    <Tooltip content={<WeekTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                    <Bar dataKey="current" name="This week" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="previous" name="Last week" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Bottom grid: customers + orders + cashiers ── */}
        <div className={`grid gap-4 ${isElevated ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>

          {/* Best Customers — admin/store-admin only */}
          {isElevated && (
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="text-primary h-4 w-4" />
                  {t('Top Customers')}
                </CardTitle>
                <CardDescription>{t('Ranked by purchase value')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[320px] pe-2">
                  {loading ? (
                    <SectionSkeleton />
                  ) : !data?.bestCustomers?.length ? (
                    <EmptyState message={t('No customers yet')} />
                  ) : (
                    <div className="space-y-2">
                      {data.bestCustomers.map((c, idx) => (
                        <div
                          key={c.id}
                          className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                        >
                          <div className="relative">
                            <AvatarBadge name={c.name ?? c.username} />
                            {idx < 3 && (
                              <span className="bg-primary text-primary-foreground absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold">
                                {idx + 1}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{c.name ?? c.username}</p>
                            <p className="text-muted-foreground truncate text-xs">{c.email}</p>
                          </div>
                          <div className="text-sm font-semibold whitespace-nowrap">
                            {formatCurrency(c.purchases_amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Recent Orders */}
          <Card className={isElevated ? 'lg:col-span-1' : 'lg:col-span-1'}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="text-primary h-4 w-4" />
                {t('Recent Orders')}
              </CardTitle>
              <CardDescription>
                {isElevated ? t('Latest orders across all cashiers') : t('Your latest orders')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[320px] pe-2">
                {loading ? (
                  <SectionSkeleton />
                ) : !data?.recentOrders?.length ? (
                  <EmptyState message={t('No orders yet')} />
                ) : (
                  <div className="space-y-2">
                    {data.recentOrders.map((order) => {
                      const { label, variant } = paymentStatusMeta(order.payment_status);
                      return (
                        <div
                          key={order.id}
                          className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                        >
                          <div className="bg-primary/10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full">
                            <ShoppingCart className="text-primary h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{order.code}</p>
                            <p className="text-muted-foreground text-xs">
                              {order.user?.name ?? order.user?.username}
                              {' · '}
                              {formatDateTime(order.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-semibold">{formatCurrency(order.total)}</span>
                            <Badge variant={variant} className="text-[10px]">
                              {t(label)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Best Cashiers — admin/store-admin only */}
          {isElevated && (
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Award className="text-primary h-4 w-4" />
                  {t('Top Cashiers')}
                </CardTitle>
                <CardDescription>{t('Ranked by total sales')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[320px] pe-2">
                  {loading ? (
                    <SectionSkeleton />
                  ) : !data?.bestCashiers?.length ? (
                    <EmptyState message={t('No cashiers yet')} />
                  ) : (
                    <div className="space-y-2">
                      {data.bestCashiers.map((cashier, idx) => (
                        <div
                          key={cashier.id}
                          className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                        >
                          <div className="relative">
                            <AvatarBadge name={cashier.username} />
                            {idx < 3 && (
                              <span className="bg-amber-500 text-white absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold">
                                {idx + 1}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{cashier.username}</p>
                            <p className="text-muted-foreground text-xs">
                              {cashier.total_sales_count ?? 0} {t('orders')}
                            </p>
                          </div>
                          <div className="text-sm font-semibold whitespace-nowrap">
                            {formatCurrency(cashier.total_sales)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
