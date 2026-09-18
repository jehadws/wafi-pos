import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Check, Database, LoaderCircle, PlayCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';

type MigrationStatus = 'pending' | 'running' | 'success' | 'error';

interface ModuleMigration {
  namespace: string;
  migrations: string[];
  [key: string]: any;
}

interface DatabaseUpdateProps {
  title: string;
  redirect: string;
  migrations: string[];
  modules: ModuleMigration[];
}

interface CoreMigrationState {
  file: string;
  status: MigrationStatus;
  message?: string;
}

interface ModuleMigrationState {
  namespace: string;
  module: ModuleMigration;
  migrations: {
    file: string;
    status: MigrationStatus;
    message?: string;
  }[];
}

export default function DatabaseUpdate({ title, redirect, migrations, modules }: DatabaseUpdateProps) {
  const { t } = useTranslation();

  const [coreMigrations, setCoreMigrations] = useState<CoreMigrationState[]>(
    migrations.map((file) => ({ file, status: 'pending' })),
  );

  const [moduleMigrations, setModuleMigrations] = useState<ModuleMigrationState[]>(
    modules.map((module) => ({
      namespace: module.namespace,
      module,
      migrations: module.migrations.map((file) => ({ file, status: 'pending' as MigrationStatus })),
    })),
  );

  const [isRunningAll, setIsRunningAll] = useState(false);

  const isAllComplete =
    coreMigrations.every((m) => m.status === 'success' || m.status === 'error') &&
    moduleMigrations.every((mm) => mm.migrations.every((m) => m.status === 'success' || m.status === 'error'));

  const hasAnyPending =
    coreMigrations.some((m) => m.status === 'pending') ||
    moduleMigrations.some((mm) => mm.migrations.some((m) => m.status === 'pending'));

  const updateCoreStatus = (file: string, status: MigrationStatus, message?: string) => {
    setCoreMigrations((prev) =>
      prev.map((m) => (m.file === file ? { ...m, status, message } : m)),
    );
  };

  const updateModuleStatus = (namespace: string, file: string, status: MigrationStatus, message?: string) => {
    setModuleMigrations((prev) =>
      prev.map((mm) =>
        mm.namespace === namespace
          ? {
              ...mm,
              migrations: mm.migrations.map((m) => (m.file === file ? { ...m, status, message } : m)),
            }
          : mm,
      ),
    );
  };

  const runCoreMigration = async (file: string): Promise<boolean> => {
    updateCoreStatus(file, 'running');
    try {
      await axios.post('/update', { file });
      updateCoreStatus(file, 'success');
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t('Migration failed.');
      updateCoreStatus(file, 'error', msg);
      toast.error(`${t('Migration failed')}: ${file}`, { description: msg });
      return false;
    }
  };

  const runModuleMigration = async (namespace: string, module: ModuleMigration, file: string): Promise<boolean> => {
    updateModuleStatus(namespace, file, 'running');
    try {
      await axios.post('/update', {
        module: {
          namespace,
          migrations: [file],
        },
      });
      updateModuleStatus(namespace, file, 'success');
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t('Migration failed.');
      updateModuleStatus(namespace, file, 'error', msg);
      toast.error(`${t('Module migration failed')}: ${file}`, { description: msg });
      return false;
    }
  };

  const runAll = async () => {
    if (isRunningAll) return;
    setIsRunningAll(true);

    let hasError = false;

    for (const m of coreMigrations) {
      if (m.status === 'success') continue;
      const ok = await runCoreMigration(m.file);
      if (!ok) hasError = true;
    }

    for (const mm of moduleMigrations) {
      for (const m of mm.migrations) {
        if (m.status === 'success') continue;
        const ok = await runModuleMigration(mm.namespace, mm.module, m.file);
        if (!ok) hasError = true;
      }
    }

    setIsRunningAll(false);

    if (!hasError) {
      toast.success(t('All migrations completed successfully.'));
      setTimeout(() => {
        router.visit(redirect);
      }, 800);
    }
  };

  const handleContinue = () => {
    router.visit(redirect);
  };

  const statusIcon = (status: MigrationStatus) => {
    switch (status) {
      case 'running':
        return <LoaderCircle className="h-4 w-4 animate-spin text-violet-500" />;
      case 'success':
        return <Check className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <span className="h-4 w-4 rounded-full border-2 border-zinc-300 dark:border-zinc-700" />;
    }
  };

  const statusBadgeClass = (status: MigrationStatus) => {
    switch (status) {
      case 'running':
        return 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900';
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900';
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900';
      default:
        return 'text-zinc-500 bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800';
    }
  };

  const statusLabel = (status: MigrationStatus) => {
    switch (status) {
      case 'running':
        return t('Running');
      case 'success':
        return t('Done');
      case 'error':
        return t('Failed');
      default:
        return t('Pending');
    }
  };

  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center p-4 sm:p-6">
      <Head title={title} />

      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="bg-primary/10 text-primary mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl">
            <Database className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">
            {t(
              'The database needs to be updated before you can continue. Review the pending migrations below and run them.',
            )}
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{t('Pending Migrations')}</CardTitle>
              <CardDescription>
                {hasAnyPending
                  ? t('Run each migration individually or run all at once.')
                  : isAllComplete
                    ? t('All migrations have been processed.')
                    : t('No migrations to run.')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasAnyPending && (
                <Button onClick={runAll} disabled={isRunningAll} className="shrink-0">
                  {isRunningAll && <LoaderCircle className="me-2 h-4 w-4 animate-spin" />}
                  <PlayCircle className="me-2 h-4 w-4" />
                  {isRunningAll ? t('Running...') : t('Run All')}
                </Button>
              )}
              {isAllComplete && (
                <Button onClick={handleContinue} className="shrink-0">
                  {t('Continue')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {coreMigrations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {t('Core Migrations')}
                  <span className="ms-2 text-xs font-normal text-muted-foreground">
                    ({coreMigrations.length})
                  </span>
                </h3>
                <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/50">
                  {coreMigrations.map((m) => (
                    <li
                      key={m.file}
                      className="flex items-center gap-3 px-3.5 py-3 text-sm sm:px-4"
                    >
                      <div className="shrink-0">{statusIcon(m.status)}</div>
                      <div className="min-w-0 flex-1">
                        <code className="block truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
                          {m.file}.php
                        </code>
                        {m.status === 'error' && m.message && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{m.message}</p>
                        )}
                      </div>
                      <span
                        className={`me-2 hidden shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium sm:inline-flex ${statusBadgeClass(m.status)}`}
                      >
                        {statusLabel(m.status)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={m.status === 'running' || m.status === 'success'}
                        onClick={() => runCoreMigration(m.file)}
                        className="shrink-0"
                      >
                        {m.status === 'running' ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <PlayCircle className="h-3.5 w-3.5" />
                        )}
                        <span className="ms-1 hidden sm:inline">{t('Run')}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {moduleMigrations.length > 0 && (
              <div className="space-y-4">
                {moduleMigrations.map((mm) => (
                  <div key={mm.namespace} className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {mm.namespace}
                      <span className="ms-2 text-xs font-normal text-muted-foreground">
                        ({mm.migrations.length})
                      </span>
                    </h3>
                    <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/50">
                      {mm.migrations.map((m) => (
                        <li
                          key={`${mm.namespace}-${m.file}`}
                          className="flex items-center gap-3 px-3.5 py-3 text-sm sm:px-4"
                        >
                          <div className="shrink-0">{statusIcon(m.status)}</div>
                          <div className="min-w-0 flex-1">
                            <code className="block truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
                              {m.file}.php
                            </code>
                            {m.status === 'error' && m.message && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{m.message}</p>
                            )}
                          </div>
                          <span
                            className={`me-2 hidden shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium sm:inline-flex ${statusBadgeClass(m.status)}`}
                          >
                            {statusLabel(m.status)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={m.status === 'running' || m.status === 'success'}
                            onClick={() => runModuleMigration(mm.namespace, mm.module, m.file)}
                            className="shrink-0"
                          >
                            {m.status === 'running' ? (
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <PlayCircle className="h-3.5 w-3.5" />
                            )}
                            <span className="ms-1 hidden sm:inline">{t('Run')}</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {coreMigrations.length === 0 && moduleMigrations.length === 0 && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <Check className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('No pending migrations.')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('Your database is up to date.')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
