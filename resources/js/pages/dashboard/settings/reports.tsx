import SettingsFormPage from '@/components/forms/config-form/settings-form-page';
import { useTranslation } from '@/lib/i18n';
import type { BreadcrumbItem } from '@/types';
import type { SettingsFormDef } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function ReportsSettingsPage() {
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
    { title: t('Report Settings'), href: '/dashboard/settings/reports' },
  ];

  return (
    <SettingsFormPage
      identifier="reports"
      initialPayload={payload}
      initialOptions={options}
      form={form}
      title={title ?? t('Report Settings')}
      description={description ?? t('Configure the settings')}
      breadcrumbs={breadcrumbs}
    />
  );
}
