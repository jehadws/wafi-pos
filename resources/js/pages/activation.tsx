import { Head, useForm } from '@inertiajs/react';
import { ShieldCheck, Copy, Check, LoaderCircle, KeyRound, Monitor } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/ui/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';

interface ActivationProps {
    hwid: string;
    isActivated?: boolean;
    deviceName?: string;
}

export default function Activation({ hwid, isActivated, deviceName }: ActivationProps) {
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
                toast.success(t('Wafi POS successfully activated!'));
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <Head title={t('System Activation - Wafi POS')} />

            <div className="w-full max-w-lg space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-2">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Wafi POS Activation</h1>
                    <p className="text-sm text-muted-foreground">
                        {t('This terminal operates on a secure closed local network. Enter your product license key below to activate.')}
                    </p>
                </div>

                <Card className="shadow-lg border-border">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-lg font-semibold">{t('Device Registration')}</CardTitle>
                        <CardDescription>
                            {t('Your unique Hardware Fingerprint is linked to this terminal.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* HWID Card */}
                        <div className="rounded-lg bg-muted p-3.5 space-y-1.5 border border-border">
                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                <span>{t('Hardware ID (HWID)')}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopyHwid}
                                    className="h-6 px-2 text-xs flex items-center gap-1 hover:bg-background"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? t('Copied') : t('Copy')}
                                </Button>
                            </div>
                            <code className="block font-mono text-xs break-all text-foreground select-all bg-background/50 p-2 rounded">
                                {hwid}
                            </code>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="device_name" className="flex items-center gap-2">
                                    <Monitor className="w-4 h-4 text-muted-foreground" />
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
                                    <KeyRound className="w-4 h-4 text-muted-foreground" />
                                    {t('Product License Key')}
                                </Label>
                                <textarea
                                    id="license_key"
                                    rows={3}
                                    autoFocus
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring break-all"
                                    value={data.license_key}
                                    onChange={(e) => setData('license_key', e.target.value.trim())}
                                    placeholder={t('Paste your cryptographically signed license key here...')}
                                    required
                                />
                                <InputError message={errors.license_key} />
                            </div>

                            <Button type="submit" className="w-full" disabled={processing}>
                                {processing && <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />}
                                {t('Activate Terminal')}
                            </Button>
                        </form>

                        <div className="text-xs text-muted-foreground text-center border-t pt-4">
                            <p>{t('CLI activation also available on server via:')}</p>
                            <code className="text-[11px] font-mono text-primary bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                                php artisan pos:activate --key="XXXX-XXXX-XXXX-XXXX"
                            </code>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
