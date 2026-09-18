import { modulesApi } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { getApiErrorMessage } from '@/utils/api-errors';
import { Link, usePage } from '@inertiajs/react';
import {
  ArchiveRestore,
  ArrowLeft,
  CheckCircle2,
  FileArchive,
  PauseCircle,
  PlayCircle,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type PageProps = {
  title: string;
  description: string;
};

type UploadStatus = 'queued' | 'uploading' | 'done' | 'error' | 'canceled';

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  controller?: AbortController;
  error?: string;
  serverMessage?: string;
};

const clampMonotonic = (current: number, next: number) => Math.min(100, Math.max(current, Math.max(0, Math.round(next))));

function formatBytes(bytes: number) {
  if (!bytes && bytes !== 0) return '';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

const ZIP_ACCEPT = '.zip,application/zip,application/x-zip-compressed';

function isZipFile(file: File): boolean {
  const nameOk = file.name.toLowerCase().endsWith('.zip');
  const typeOk = file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.type === '';
  return nameOk || typeOk;
}

export default function UploadModulePage() {
  const { t } = useTranslation();
  const { title, description } = usePage<PageProps>().props;

  const [dragActive, setDragActive] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const mapped: UploadItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      progress: 0,
      status: 'queued',
    }));
    setItems((prev) => [...mapped, ...prev]);
    mapped.forEach((m) => {
      if (!isZipFile(m.file)) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === m.id
              ? { ...it, status: 'error', error: t('Only .zip module packages are supported.') }
              : it,
          ),
        );
        return;
      }
      void startUpload(m.id, m.file);
    });
  };

  const startUpload = async (id: string, file: File) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'uploading', progress: clampMonotonic(it.progress, 1), error: undefined } : it)),
    );

    const controller = new AbortController();
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, controller } : it)));

    let fallbackProgress = 0;
    const fallback = setInterval(() => {
      fallbackProgress = Math.min(fallbackProgress + 2, 90);
      setItems((prev) =>
        prev.map((it) => (it.id === id && it.status === 'uploading' ? { ...it, progress: clampMonotonic(it.progress, fallbackProgress) } : it)),
      );
    }, 120);

    try {
      const form = new FormData();
      form.append('module', file, file.name);

      const res: any = await modulesApi.upload(form, {
        signal: controller.signal,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setItems((prev) =>
            prev.map((it) => (it.id === id ? { ...it, progress: clampMonotonic(it.progress, Math.max(pct, fallbackProgress)) } : it)),
          );
        },
      });

      clearInterval(fallback);

      const status: string | undefined = res?.status;
      const ok = status === 'success';
      const message: string | undefined = res?.message;

      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                status: ok ? 'done' : 'error',
                progress: ok ? 100 : it.progress,
                serverMessage: message,
                error: ok ? undefined : message || t('Upload failed.'),
              }
            : it,
        ),
      );

      if (ok) {
        toast.success(message || t('Module uploaded successfully.'));
      } else {
        toast.error(message || t('Upload failed.'));
      }
    } catch (err: any) {
      clearInterval(fallback);
      const wasAborted = err?.name === 'CanceledError' || err?.message === 'canceled';
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                status: wasAborted ? 'canceled' : 'error',
                error: wasAborted ? t('Upload canceled') : getApiErrorMessage(err, t('Upload failed.')),
              }
            : it,
        ),
      );
      if (!wasAborted) {
        toast.error(getApiErrorMessage(err, t('Upload failed.')));
      }
    }
  };

  const cancelUpload = (id: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it?.controller) it.controller.abort();
      return prev.map((x) => (x.id === id ? { ...x, status: 'canceled' } : x));
    });
  };

  const retryUpload = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    startUpload(id, item.file);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleClickBrowse = () => inputRef.current?.click();

  useEffect(() => {
    return () => {
      items.forEach((i) => i.controller?.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/dashboard/modules" className="text-muted-foreground mb-3 inline-flex items-center gap-1.5 text-sm hover:underline">
              <ArrowLeft className="h-4 w-4" /> {t('Back to Modules')}
            </Link>
            <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          </div>
          <Link href="/dashboard/modules">
            <Button variant="outline">
              <ArchiveRestore className="me-2 h-4 w-4" />
              {t('Manage Modules')}
            </Button>
          </Link>
        </header>

        <Card className="border-dashed shadow-none">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl">{t('Upload a Module Package')}</CardTitle>
            <CardDescription>
              {t('Drop a .zip module bundle here, or click to browse. Upload progress is shown per file.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
              }}
              onDrop={handleDrop}
              className={`group relative flex min-h-[200px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/30'
                  : 'border-gray-300 bg-white/80 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900/60'
              }`}
              onClick={handleClickBrowse}
              role="button"
              aria-label={t('Click to browse or drag zip files to upload')}
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-emerald-500/5 to-fuchsia-500/5 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
              <div className="z-10 flex flex-col items-center gap-2 p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium">{t('Click to browse or drag and drop a .zip module bundle')}</p>
                <p className="text-muted-foreground max-w-md text-xs">
                  {t('Valid Subul/Sb module packages containing a config.xml manifest. Each package is validated on the server.')}
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept={ZIP_ACCEPT}
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            <div className="mt-6">
              {items.length === 0 ? (
                <div className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm dark:border-gray-800">
                  {t('Your upload queue is empty.')}
                </div>
              ) : (
                <div className="grid gap-3">
                  {items.map((item) => {
                    const isDone = item.status === 'done';
                    const isError = item.status === 'error';
                    const isUploading = item.status === 'uploading';
                    const isCanceled = item.status === 'canceled';
                    return (
                      <Card key={item.id} className="overflow-hidden border border-gray-200 dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                              <FileArchive className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="truncate">
                                  <p className="truncate font-medium text-gray-900 dark:text-gray-100">{item.file.name}</p>
                                  <p className="text-muted-foreground text-xs">{formatBytes(item.file.size)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isDone && (
                                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                                      <CheckCircle2 className="me-1 h-3 w-3" /> {t('Uploaded')}
                                    </Badge>
                                  )}
                                  {isError && (
                                    <Badge variant="destructive">
                                      <XCircle className="me-1 h-3 w-3" /> {t('Error')}
                                    </Badge>
                                  )}
                                  {isCanceled && <Badge variant="outline">{t('Canceled')}</Badge>}
                                  {isUploading && <Badge variant="outline">{t('Uploading…')}</Badge>}
                                </div>
                              </div>
                              <div className="mt-3">
                                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                                  <div
                                    className="h-full rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.35)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.35)_50%,rgba(255,255,255,0.35)_75%,transparent_75%,transparent)] bg-[length:20px_20px] transition-[width] duration-300 ease-out"
                                    style={{
                                      width: `${item.progress}%`,
                                      backgroundColor: isError ? '#ef4444' : isDone ? '#10b981' : '#6366f1',
                                      backgroundBlendMode: 'overlay',
                                      boxShadow: 'inset 0 0 6px rgba(0,0,0,0.12)',
                                    }}
                                  />
                                </div>
                                <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
                                  <span className="tabular-nums">{item.progress}%</span>
                                  {item.serverMessage && isDone && (
                                    <span className="truncate text-emerald-700 dark:text-emerald-400">{item.serverMessage}</span>
                                  )}
                                  {item.error && (isError || isCanceled) && (
                                    <span className="truncate text-rose-700 dark:text-rose-400">{item.error}</span>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                {isUploading && (
                                  <Button size="sm" variant="ghost" onClick={() => cancelUpload(item.id)}>
                                    <PauseCircle className="me-2 h-4 w-4" /> {t('Cancel')}
                                  </Button>
                                )}
                                {(isError || isCanceled) && (
                                  <Button size="sm" variant="outline" onClick={() => retryUpload(item.id)}>
                                    <PlayCircle className="me-2 h-4 w-4" /> {t('Retry')}
                                  </Button>
                                )}
                                {isDone && (
                                  <Link href="/dashboard/modules">
                                    <Button size="sm" variant="outline">
                                      <ArchiveRestore className="me-2 h-4 w-4" /> {t('View in Modules')}
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="me-2 h-4 w-4" /> {t('Remove')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
