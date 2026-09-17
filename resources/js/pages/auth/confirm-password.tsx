import { Head } from '@inertiajs/react';

import AuthFormShell from '@/components/auth/auth-form-shell';
import type { FormFieldDef } from '@/types/forms';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from '@/lib/i18n';

interface Props {
  fields: FormFieldDef[];
}

export default function ConfirmPassword({ fields }: Props) {
  const { t } = useTranslation();

  return (
    <AuthLayout
      title={t('Confirm your password')}
      description={t('This is a secure area of the application. Please confirm your password before continuing')}
    >
      <Head title={t('Confirm password')} />

      <AuthFormShell
        fields={fields}
        submitUrl={route('password.confirm')}
        submitLabel={t('Confirm password')}
        onSuccessRedirect={null}
        resetFieldsOnFinish={['password']}
        className="w-full"
      />
    </AuthLayout>
  );
}
