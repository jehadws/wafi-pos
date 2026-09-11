import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import { ResetDangerZone } from '@/components/settings/reset/reset-danger-zone';
import { ResetForm } from '@/components/settings/reset/reset-form';
import type { ResetPageProps } from '@/components/settings/reset/types';
import { useResetSettings } from '@/components/settings/reset/use-reset-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import type { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';

export default function ResetSettingsPage() {
  const {
    title = 'Reset Database',
    description = 'Wipe transactions and optionally populate fresh demo data.',
    options = { modes: [] },
    payload,
  } = usePage<ResetPageProps & Record<string, unknown>>().props;

  const { t } = useTranslation();
  const { form, isPending, isConfirmOpen, openConfirmation, closeConfirmation, handleReset } = useResetSettings(payload);

  const breadcrumbs: BreadcrumbItem[] = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Settings'), href: '/dashboard/settings/general' },
    { title: t('Reset Database'), href: '/dashboard/settings/reset' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t(title)} />
      <div className="p-6">
        <div className="max-w-5xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t(title)}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t(description)}</p>
          </div>

          {/* Danger Zone Warning Card */}
          <ResetDangerZone />

          {/* Reset Configuration Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RotateCcw className="text-muted-foreground h-5 w-5" />
                <span>{t('Reset Options')}</span>
              </CardTitle>
              <CardDescription>{t('Choose how you would like to reset your database and initialize sample records.')}</CardDescription>
            </CardHeader>

            <CardContent>
              <ResetForm form={form} options={options} disabled={isPending} />
            </CardContent>

            <CardFooter className="bg-muted/20 flex items-center justify-between border-t p-4">
              <p className="text-muted-foreground hidden text-xs sm:block">{t('Action cannot be undone once confirmed.')}</p>
              <Button type="button" variant="destructive" onClick={openConfirmation} disabled={isPending} className="ms-auto w-full sm:w-auto">
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
              'This action will permanently wipe existing orders, customers, procurements, and transactions from the database. This operation cannot be undone.',
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
