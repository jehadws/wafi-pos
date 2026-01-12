import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

type KV = Record<string, string | number | boolean>;
type AboutData = {
    title: string;
    description?: string;
    details: KV;
    extensions: Record<string, boolean>;
    configurations: KV;
    developpers: KV;
};

function toYesNo(val: unknown, t: { (key: string): string }) {
    if (typeof val === 'boolean') return val ? t('Yes') : t('No');
    if (typeof val === 'string') return val;
    return String(val ?? '');
}

export default function AboutPage() {
    const { t } = useTranslation();
    const { title, description, details, extensions, configurations, developpers } = usePage<AboutData>().props;

    const extStats = useMemo(() => {
        const entries = Object.entries(extensions || {});
        const total = entries.length || 1;
        const enabled = entries.filter(([, v]) => v).length;
        const pct = Math.round((enabled / total) * 100);
        return { total, enabled, pct };
    }, [extensions]);

    const Hero = (
        <div className="space-y-4">
            {(title || description) && (
                <div>
                    {title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}
                    {description && <p className="text-muted-foreground">{description}</p>}
                </div>
            )}
        </div>
    );

    const Versions = (
        <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('Environment Summary')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(details || {}).map(([k, v]) => (
                        <div key={k} className="rounded-xl border p-4">
                            <div className="text-muted-foreground text-xs">{k}</div>
                            <div className="mt-1 text-xl font-semibold">{String(v)}</div>
                        </div>
                    ))}
                    <div className="rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground text-xs">{t('Extensions Health')}</div>
                            <Badge variant={extStats.pct === 100 ? 'default' : 'secondary'}>
                                {extStats.enabled}/{extStats.total}
                            </Badge>
                        </div>
                        <div className="mt-3">
                            <Progress value={extStats.pct} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const Extensions = (
        <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('Extensions')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Extension')}</TableHead>
                                <TableHead className="w-[140px] text-center">{t('Status')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(extensions || {}).map(([k, v]) => {
                                const ok = !!v;
                                return (
                                    <TableRow
                                        key={k}
                                        className={ok ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : 'bg-rose-50/50 dark:bg-rose-950/20'}
                                    >
                                        <TableCell className="font-medium">{k}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={ok ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-rose-600 hover:bg-rose-600'}>
                                                {ok ? t('Yes') : t('No')}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );

    const Configs = (
        <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('Configurations')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Property')}</TableHead>
                                <TableHead className="w-[200px] text-right">{t('Value')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(configurations || {}).map(([k, v]) => (
                                <TableRow key={k}>
                                    <TableCell className="font-medium">{k}</TableCell>
                                    <TableCell className="text-right">
                                        {typeof v === 'boolean' ? (
                                            <Badge variant={v ? 'default' : 'secondary'}>{toYesNo(v, t)}</Badge>
                                        ) : (
                                            <span className="tabular-nums">{toYesNo(v, t)}</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );

    const Developers = (
        <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('Developers')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {Object.entries(developpers || {}).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                            <div>
                                <div className="text-muted-foreground text-xs">{k}</div>
                                <div className="mt-0.5 font-medium break-all">{String(v)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('Dashboard'), href: '/dashboard' },
                { title: t('Settings'), href: '/dashboard/settings' },
                { title: t('About'), href: '/dashboard/settings/about' },
            ]}
        >
            <div className="min-h-screen p-6">
                <div className="space-y-6">
                    {Hero}
                    {Versions}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {Extensions}
                        {Configs}
                    </div>
                    {Developers}
                </div>
            </div>
        </AppLayout>
    );
}
