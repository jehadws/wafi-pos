import { Head, useForm } from '@inertiajs/react';
import { Check, Copy, KeyRound, LoaderCircle, Monitor, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface ActivationProps {
  hwid: string;
  isActivated?: boolean;
  deviceName?: string;
}

export default function Activation({ hwid, deviceName }: ActivationProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const { data, setData, post, processing, errors } = useForm({
    license_key: '',
    device_name: deviceName || 'Main POS Terminal',
  });

  const handleCopyHwid = () => {
    navigator.clipboard.writeText(hwid);
    setCopied(true);
    toast.success(t('Hardware ID copied to clipboard'));
    setTimeout(() => setCopied(false), 2000);
  };

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/activate', {
      onError: () => {
        toast.error(t('Activation failed. Please check your key.'));
      },
      onSuccess: () => {
        toast.success(t('Subul successfully activated!'));
      },
    });
  };

  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <Head title={t('System Activation')} />

      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <div className="bg-primary/10 text-primary mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl">
            <ShieldCheck className="text-primary h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Subul Activation</h1>
          <p className="text-muted-foreground text-sm">
            {t('This terminal operates on a secure closed local network. Enter your product license key below to activate.')}
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">{t('Device Registration')}</CardTitle>
            <CardDescription>{t('Your unique Hardware Fingerprint is linked to this terminal.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* HWID Card */}
            <div className="bg-muted border-border space-y-1.5 rounded-lg border p-3.5">
              <div className="text-muted-foreground flex items-center justify-between text-xs font-medium">
                <span>{t('Hardware ID (HWID)')}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyHwid}
                  className="hover:bg-background flex h-6 items-center gap-1 px-2 text-xs"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t('Copied') : t('Copy')}
                </Button>
              </div>
              <code className="text-foreground bg-background/50 block rounded p-2 font-mono text-xs break-all select-all">{hwid}</code>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="device_name" className="flex items-center gap-2">
                  <Monitor className="text-muted-foreground h-4 w-4" />
                  {t('Terminal / Counter Name')}
                </Label>
                <Input
                  id="device_name"
                  type="text"
                  value={data.device_name}
                  onChange={(e) => setData('device_name', e.target.value)}
                  placeholder={t('e.g. Counter 1, Express Terminal')}
                  required
                />
                <InputError message={errors.device_name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_key" className="flex items-center gap-2">
                  <KeyRound className="text-muted-foreground h-4 w-4" />
                  {t('Product License Key')}
                </Label>
                <textarea
                  id="license_key"
                  rows={3}
                  autoFocus
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 font-mono text-xs break-all shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                  value={data.license_key}
                  onChange={(e) => setData('license_key', e.target.value.trim())}
                  placeholder={t('Paste your cryptographically signed license key here...')}
                  required
                />
                <InputError message={errors.license_key} />
              </div>

              <Button type="submit" className="w-full" disabled={processing}>
                {processing && <LoaderCircle className="me-2 h-4 w-4 animate-spin" />}
                {t('Activate Terminal')}
              </Button>
            </form>

            <div className="text-muted-foreground border-t pt-4 text-center text-xs">
              <p>{t('CLI activation also available on server via:')}</p>
              <code className="text-primary bg-muted mt-1 inline-block rounded px-1.5 py-0.5 font-mono text-[11px]">
                php artisan pos:activate --key="XXXX-XXXX-XXXX-XXXX"
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
