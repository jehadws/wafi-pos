import { transactionsApi } from '@/api';
import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import SettingsFormPage from '@/components/forms/config-form/settings-form-page';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import type { BreadcrumbItem } from '@/types';
import type { SettingsFormDef } from '@/types/forms';
import { getApiErrorMessage } from '@/utils/api-errors';
import { usePage } from '@inertiajs/react';
import { Loader2, RotateCcw } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

export default function AccountingSettingsPage() {
  const { options, payload, form, title, description } = usePage<{
    options?: Record<string, unknown>;
    payload?: Record<string, unknown>;
    form?: SettingsFormDef;
    title?: string;
    description?: string;
  }>().props;
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleReset = async () => {
    startTransition(async () => {
      try {
        await transactionsApi.resetAccountDefaults();
        setIsOpen(false);
        toast.success(t('Settings saved'), { description: t('The default accounts has been created.') });
      } catch (e: unknown) {
        toast.error(t('Failed to save'), {
          description: getApiErrorMessage(e, t('An unexpected error occurred.')),
        });
      }
    });
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Settings'), href: '/dashboard/settings/general' },
    { title: t('Accounting Settings'), href: '/dashboard/settings/accounting' },
  ];

  return (
    <>
      <SettingsFormPage
        identifier="accounting"
        initialPayload={payload}
        initialOptions={options}
        form={form}
        title={title ?? t('Accounting Settings')}
        description={description ?? t('Configure the accounting feature.')}
        breadcrumbs={breadcrumbs}
        footerActions={
          <Button type="button" onClick={() => setIsOpen(true)} disabled={isPending} variant="destructive">
            {isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RotateCcw className="me-2 h-4 w-4" />}
            {t('Reset Default')}
          </Button>
        }
        customSections={
          <ConfirmationDialog
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onConfirm={() => void handleReset()}
            title={t('Confirm Your Action')}
            description={t(
              'This will clear all records and accounts. It is ideal if you want to start from scratch. Are you sure you want to reset default settings for accounting?',
            )}
            confirmText={t('Yes')}
            cancelText={t('No')}
            variant="destructive"
            loading={isPending}
          />
        }
      />
    </>
  );
}
