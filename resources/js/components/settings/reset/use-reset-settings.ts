import { resetApi } from '@/api';
import { useTranslation } from '@/lib/i18n';
import { useForm } from '@inertiajs/react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { ResetSettingsPayload } from './types';

const defaultPayload: ResetSettingsPayload = {
  mode: 'wipe_plus_grocery',
  create_sales: true,
  create_procurements: true,
};

export function useResetSettings(initialPayload?: Partial<ResetSettingsPayload>) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const form = useForm<ResetSettingsPayload>({
    mode: initialPayload?.mode ?? defaultPayload.mode,
    create_sales: initialPayload?.create_sales ?? defaultPayload.create_sales,
    create_procurements: initialPayload?.create_procurements ?? defaultPayload.create_procurements,
  });

  const openConfirmation = () => setIsConfirmOpen(true);
  const closeConfirmation = () => setIsConfirmOpen(false);

  const handleReset = () => {
    startTransition(async () => {
      try {
        const response = await resetApi.resetDatabase({
          mode: form.data.mode,
          create_sales: form.data.create_sales,
          create_procurements: form.data.create_procurements,
        });

        closeConfirmation();
        toast.success(response?.message || t('The database has been reset successfully.'));

        // Reload window after brief moment so cached options and stores refresh cleanly
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || t('Failed to reset database. Please try again.');
        toast.error(message);
      }
    });
  };

  return {
    form,
    isPending,
    isConfirmOpen,
    openConfirmation,
    closeConfirmation,
    handleReset,
  };
}
