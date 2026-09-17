import { Head } from '@inertiajs/react';

import AuthFormShell from '@/components/auth/auth-form-shell';
import type { FormFieldDef } from '@/types/forms';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from '@/lib/i18n';

interface ResetPasswordProps {
  token: string;
  email: string;
  fields: FormFieldDef[];
}

export default function ResetPassword({ token, email, fields }: ResetPasswordProps) {
  const { t } = useTranslation();

  return (
    <AuthLayout title={t('Reset password')} description={t('Please enter your new password below')}>
      <Head title={t('Reset password')} />

      <AuthFormShell
        fields={fields}
        submitUrl={route('password.store')}
        submitLabel={t('Reset password')}
        initialValues={{ email, token }}
        onSuccessRedirect={route('login')}
        resetFieldsOnFinish={['password', 'password_confirmation']}
        className="w-full"
      />
    </AuthLayout>
  );
}
