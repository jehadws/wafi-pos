import SettingsFormPage from '@/components/forms/config-form/settings-form-page';
import { useTranslation } from '@/lib/i18n';
import type { BreadcrumbItem } from '@/types';
import type { SettingsFormDef } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function InvoicesSettingsPage() {
  const { options, payload, form, title, description } = usePage<{
    options?: Record<string, unknown>;
    payload?: Record<string, unknown>;
    form?: SettingsFormDef;
    title?: string;
    description?: string;
  }>().props;
  const { t } = useTranslation();

  const breadcrumbs: BreadcrumbItem[] = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Settings'), href: '/dashboard/settings/general' },
    { title: t('Invoice Settings'), href: '/dashboard/settings/invoices' },
  ];

  return (
    <SettingsFormPage
      identifier="invoices"
      initialPayload={payload}
      initialOptions={options}
      form={form}
      title={title ?? t('Invoice Settings')}
      description={description ?? t('Configure how invoice and receipts are used.')}
      breadcrumbs={breadcrumbs}
    />
  );
}
