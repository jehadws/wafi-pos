import SettingsFormPage from '@/components/forms/config-form/settings-form-page';
import { useTranslation } from '@/lib/i18n';
import type { BreadcrumbItem } from '@/types';
import type { SettingsFormDef } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function GeneralSettingsPage() {
  const { options, payload, settings, form, title, description } = usePage<{
    options?: Record<string, unknown>;
    payload?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    form?: SettingsFormDef;
    title?: string;
    description?: string;
  }>().props;
  const { t } = useTranslation();

  const breadcrumbs: BreadcrumbItem[] = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Settings'), href: '/dashboard/settings/general' },
    { title: t('General Settings'), href: '/dashboard/settings/general' },
  ];

  return (
    <SettingsFormPage
      identifier="general"
      initialPayload={payload ?? settings}
      initialOptions={options}
      form={form}
      title={title ?? t('General Settings')}
      description={description ?? t('Configure the general settings.')}
      breadcrumbs={breadcrumbs}
    />
  );
}
