import { modulesApi } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import type { Module, ModuleListResponse, ModuleStatus } from '@/types/models/module';
import { getApiErrorMessage } from '@/utils/api-errors';
import { usePage } from '@inertiajs/react';
import {
  DatabaseZap,
  Download,
  Package,
  Plus,
  ShieldCheck,
  ShieldOff,
  ShieldX,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { toast } from 'sonner';

type PageProps = {
  title: string;
  description: string;
  modules: Module[];
  total_enabled: number;
  total_disabled: number;
  total_invalid: number;
};

type LoadingMap = Record<string, 'enabling' | 'disabling' | 'deleting' | 'migrating' | undefined>;

function countDeps(mod: Module): number {
  const keys = mod.requires ? Object.keys(mod.requires) : [];
  return keys.length;
}

function hasPendingMigrations(mod: Module): boolean {
  return Array.isArray(mod.migrations) && mod.migrations.length > 0;
}

export default function ModulesPage() {
  const { t } = useTranslation();
  const { title, description } = usePage<PageProps>().props;
  const initialModules = usePage<PageProps>().props.modules;
  const initialTotals = {
    total_enabled: usePage<PageProps>().props.total_enabled,
    total_disabled: usePage<PageProps>().props.total_disabled,
    total_invalid: usePage<PageProps>().props.total_invalid,
  };

  const [tab, setTab] = useState<ModuleStatus>('all');
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [totals, setTotals] = useState(initialTotals);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<LoadingMap>({});

  const refreshList = async (status: ModuleStatus = tab) => {
    setLoading(true);
    try {
      const res: ModuleListResponse = await modulesApi.list(status);
      setModules(res.modules ?? []);
      setTotals({
        total_enabled: res.total_enabled ?? 0,
        total_disabled: res.total_disabled ?? 0,
        total_invalid: res.total_invalid ?? 0,
      });
    } catch (e) {
      toast.error(getApiErrorMessage(e, t('Failed to load modules.')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'all') return;
    void refreshList(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const updateLocally = (namespace: string, patch: Partial<Module>) => {
    setModules((prev) => prev.map((m) => (m.namespace === namespace ? { ...m, ...patch } : m)));
  };

  const onToggle = async (mod: Module, nextEnabled: boolean) => {
    if (mod.autoloaded) return;
    if (nextEnabled === mod.enabled) return;
    const ns = mod.namespace;
    setActionLoading((prev) => ({ ...prev, [ns]: nextEnabled ? 'enabling' : 'disabling' }));
    try {
      const res = nextEnabled ? await modulesApi.enable(ns) : await modulesApi.disable(ns);
      const ok = res?.status === 'success';
      if (!ok) {
        toast.error(res?.message || t('Failed to update module status.'));
        return;
      }
      updateLocally(ns, { enabled: nextEnabled });
      setTotals((prev) => ({
        ...prev,
        total_enabled: nextEnabled ? prev.total_enabled + 1 : Math.max(0, prev.total_enabled - 1),
        total_disabled: nextEnabled ? Math.max(0, prev.total_disabled - 1) : prev.total_disabled + 1,
      }));
      toast.success(res.message || t('Module updated successfully.'));
    } catch (e) {
      toast.error(getApiErrorMessage(e, t('Failed to update module status.')));
    } finally {
      setActionLoading((prev) => ({ ...prev, [ns]: undefined }));
    }
  };

  const onDelete = async (mod: Module) => {
    if (mod.autoloaded) return;
    const ok = window.confirm(t('Delete module "{name}"? This cannot be undone.', { name: mod.name }));
    if (!ok) return;
    const ns = mod.namespace;
    setActionLoading((prev) => ({ ...prev, [ns]: 'deleting' }));
    try {
      const res = await modulesApi.delete(ns);
      const success = res?.status === 'success';
      if (!success) {
        toast.error(res?.message || t('Failed to delete module.'));
        return;
      }
      setModules((prev) => prev.filter((m) => m.namespace !== ns));
      setTotals((prev) => ({
        ...prev,
        total_enabled: mod.enabled ? Math.max(0, prev.total_enabled - 1) : prev.total_enabled,
        total_disabled: !mod.enabled ? Math.max(0, prev.total_disabled - 1) : prev.total_disabled,
      }));
      toast.success(res.message || t('Module deleted successfully.'));
    } catch (e) {
      toast.error(getApiErrorMessage(e, t('Failed to delete module.')));
    } finally {
      setActionLoading((prev) => ({ ...prev, [ns]: undefined }));
    }
  };

  const onMigrate = async (mod: Module) => {
    const ns = mod.namespace;
    setActionLoading((prev) => ({ ...prev, [ns]: 'migrating' }));
    try {
      const url = modulesApi.migrateUrl(ns);
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({ message: t('Migration request completed.') }));
      if (!res.ok) {
        toast.error(data?.message || t('Failed to run migrations.'));
        return;
      }
      toast.success(data?.message || t('Migrations ran successfully.'));
      void refreshList();
    } catch (e) {
      toast.error(getApiErrorMessage(e, t('Failed to run migrations.')));
    } finally {
      setActionLoading((prev) => ({ ...prev, [ns]: undefined }));
    }
  };

  const onDownload = (mod: Module) => {
    window.open(modulesApi.downloadUrl(mod.namespace), '_blank');
  };

  const totalAll = useMemo(
    () => totals.total_enabled + totals.total_disabled + totals.total_invalid,
    [totals],
  );

  const counts: { key: ModuleStatus; label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { key: 'all', label: t('Total Modules'), value: totalAll, icon: Package, color: 'text-indigo-600 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/40' },
    { key: 'enabled', label: t('Enabled'), value: totals.total_enabled, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40' },
    { key: 'disabled', label: t('Disabled'), value: totals.total_disabled, icon: ShieldOff, color: 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40' },
    { key: 'invalid', label: t('Invalid'), value: totals.total_invalid, icon: ShieldX, color: 'text-rose-600 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/40' },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/modules/upload">
              <Button>
                <UploadCloud className="me-2 h-4 w-4" />
                {t('Upload Module')}
              </Button>
            </Link>
            <Button variant="outline" onClick={() => void refreshList(tab)} disabled={loading}>
              {t('Refresh')}
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {counts.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.key} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                  <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${c.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="text-2xl font-bold tabular-nums">{c.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Tabs value={tab} onValueChange={(v) => setTab(v as ModuleStatus)} className="w-full">
          <TabsList>
            <TabsTrigger value="all">{t('All')}</TabsTrigger>
            <TabsTrigger value="enabled">{t('Enabled')}</TabsTrigger>
            <TabsTrigger value="disabled">{t('Disabled')}</TabsTrigger>
            <TabsTrigger value="invalid">{t('Invalid')}</TabsTrigger>
          </TabsList>

          {(['all', 'enabled', 'disabled', 'invalid'] as ModuleStatus[]).map((status) => (
            <TabsContent key={status} value={status} className="pt-4">
              {loading ? (
                <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">{t('Loading modules…')}</div>
              ) : modules.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">
                    <Package className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-semibold">{t('No modules found')}</h3>
                  <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                    {t('Upload a zip module package or check back after enabling extensions.')}
                  </p>
                  <Link className="mt-4" href="/dashboard/modules/upload">
                    <Button size="sm">
                      <Plus className="me-2 h-4 w-4" /> {t('Upload Module')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {modules.map((mod) => {
                    const depCount = countDeps(mod);
                    const pendingMigrations = hasPendingMigrations(mod);
                    const currentAction = actionLoading[mod.namespace];
                    const canChangeState = !mod.autoloaded && !currentAction;
                    return (
                      <Card key={mod.namespace} className="flex flex-col shadow-sm">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                              <Package className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <CardTitle className="truncate text-base leading-tight">{mod.name}</CardTitle>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {mod.autoloaded ? (
                                  <Badge variant="outline" className="text-xs">
                                    {t('Autoloaded')}
                                  </Badge>
                                ) : mod.enabled ? (
                                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    {t('Enabled')}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    {t('Disabled')}
                                  </Badge>
                                )}
                                {!mod['psr-4-compliance'] && (
                                  <Badge variant="destructive" className="text-xs">
                                    <XCircle className="me-1 h-3 w-3" />
                                    {t('PSR-4')}
                                  </Badge>
                                )}
                                {pendingMigrations && (
                                  <Badge className="bg-amber-500 text-white hover:bg-amber-500" variant="default">
                                    <DatabaseZap className="me-1 h-3 w-3" />
                                    {t('Migrations pending')}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs font-mono tabular-nums">
                                  v{mod.version}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <CardDescription className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm">
                            {mod.description || t('No description provided.')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 p-4 pt-2 text-sm">
                          <dl className="grid grid-cols-[auto_1fr] gap-y-1.5 gap-x-3">
                            <dt className="text-muted-foreground">{t('Namespace')}:</dt>
                            <dd className="truncate font-mono text-xs">{mod.namespace}</dd>
                            {mod.author && (
                              <>
                                <dt className="text-muted-foreground">{t('Author')}:</dt>
                                <dd className="truncate">{mod.author}</dd>
                              </>
                            )}
                            {depCount > 0 && (
                              <>
                                <dt className="text-muted-foreground">{t('Dependencies')}:</dt>
                                <dd>{t('{count} required', { count: depCount })}</dd>
                              </>
                            )}
                          </dl>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 p-4 pt-0">
                          <div className="flex w-full items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">{mod.enabled ? t('Disable') : t('Enable')}</span>
                              <Switch
                                checked={mod.enabled}
                                disabled={!canChangeState}
                                onCheckedChange={(checked) => onToggle(mod, checked)}
                                aria-label={mod.enabled ? t('Disable module') : t('Enable module')}
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => onDownload(mod)}
                                title={t('Download zip')}
                                aria-label={t('Download module zip')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                disabled={!pendingMigrations || currentAction !== undefined}
                                onClick={() => onMigrate(mod)}
                                title={t('Run migrations')}
                                aria-label={t('Run module migrations')}
                              >
                                <DatabaseZap className={`h-4 w-4 ${currentAction === 'migrating' ? 'animate-pulse' : ''}`} />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="text-rose-600 hover:text-rose-700 disabled:text-rose-300"
                                onClick={() => onDelete(mod)}
                                disabled={mod.autoloaded || currentAction !== undefined}
                                title={t('Delete module')}
                                aria-label={t('Delete module')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {mod.autoloaded && (
                            <p className="text-muted-foreground text-xs">
                              {t('Autoloaded modules cannot be enabled, disabled, or deleted from the UI.')}
                            </p>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}
