import { Head } from '@inertiajs/react';

import TextLink from '@/components/common/text-link';
import AuthFormShell from '@/components/auth/auth-form-shell';
import type { FormFieldDef } from '@/types/forms';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from '@/lib/i18n';

interface Props {
  status?: string;
  fields: FormFieldDef[];
}

export default function ForgotPassword({ status, fields }: Props) {
  const { t } = useTranslation();

  return (
    <AuthLayout title={t('Forgot password')} description={t('Enter your email to receive a password reset link')}>
      <Head title={t('Forgot password')} />

      <div className="space-y-6">
        <AuthFormShell
          fields={fields}
          submitUrl={route('password.email')}
          submitLabel={t('Email password reset link')}
          statusBanner={status ?? null}
          onSuccessRedirect={null}
          className="w-full"
        />

        <div className="text-muted-foreground space-x-1 text-center text-sm rtl:space-x-reverse">
          <span>{t('Or, return to')}</span>
          <TextLink href={route('login')}>{t('log in')}</TextLink>
        </div>
      </div>
    </AuthLayout>
  );
}
