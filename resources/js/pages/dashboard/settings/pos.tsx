import SettingsFormPage from '@/components/forms/config-form/settings-form-page';
import { useTranslation } from '@/lib/i18n';
import type { BreadcrumbItem } from '@/types';
import type { SettingsFormDef } from '@/types/forms';
import { usePage } from '@inertiajs/react';

export default function PosSettingsPage() {
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
    { title: t('POS Settings'), href: '/dashboard/settings/pos' },
  ];

  return (
    <SettingsFormPage
      identifier="pos"
      initialPayload={payload}
      initialOptions={options}
      form={form}
      title={title ?? t('POS Settings')}
      description={description ?? t('Configure the pos settings.')}
      breadcrumbs={breadcrumbs}
    />
  );
}
