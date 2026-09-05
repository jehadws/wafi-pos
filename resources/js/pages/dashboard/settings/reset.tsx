import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import { useTranslation } from '@/lib/i18n';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { useResetSettings } from '@/components/settings/reset/use-reset-settings';
import { ResetDangerZone } from '@/components/settings/reset/reset-danger-zone';
import { ResetForm } from '@/components/settings/reset/reset-form';
import type { ResetPageProps } from '@/components/settings/reset/types';

export default function ResetSettingsPage() {
    const {
        title = 'Reset Database',
        description = 'Wipe transactions and optionally populate fresh demo data.',
        options = { modes: [] },
        payload,
    } = usePage<ResetPageProps & Record<string, unknown>>().props;

    const { t } = useTranslation();
    const {
        form,
        isPending,
        isConfirmOpen,
        openConfirmation,
        closeConfirmation,
        handleReset,
    } = useResetSettings(payload);

    return (
        <AppLayout>
            <div className="p-6">
                <div className="space-y-6 max-w-5xl">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">{t(title)}</h1>
                        <p className="text-muted-foreground text-sm mt-1">{t(description)}</p>
                    </div>

                    {/* Danger Zone Warning Card */}
                    <ResetDangerZone />

                    {/* Reset Configuration Form Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <RotateCcw className="h-5 w-5 text-muted-foreground" />
                                <span>{t('Reset Options')}</span>
                            </CardTitle>
                            <CardDescription>
                                {t('Choose how you would like to reset your database and initialize sample records.')}
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <ResetForm form={form} options={options} disabled={isPending} />
                        </CardContent>

                        <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/20">
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                {t('Action cannot be undone once confirmed.')}
                            </p>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={openConfirmation}
                                disabled={isPending}
                                className="w-full sm:w-auto ms-auto"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                        {t('Resetting Database...')}
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="me-2 h-4 w-4" />
                                        {t('Reset Database')}
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Confirmation Modal */}
                    <ConfirmationDialog
                        isOpen={isConfirmOpen}
                        onClose={closeConfirmation}
                        onConfirm={handleReset}
                        title={t('Are you absolutely sure?')}
                        description={t(
                            'This action will permanently wipe existing orders, customers, procurements, and transactions from the database. This operation cannot be undone.'
                        )}
                        confirmText={t('Yes, Reset Database')}
                        cancelText={t('Cancel')}
                        variant="destructive"
                        loading={isPending}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
