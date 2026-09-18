import { Head } from '@inertiajs/react';

import TextLink from '@/components/common/text-link';
import AuthFormShell from '@/components/auth/auth-form-shell';
import type { FormFieldDef } from '@/types/forms';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from '@/lib/i18n';
import type { ReactNode } from 'react';

interface LoginProps {
  status?: string;
  canResetPassword: boolean;
  fields: FormFieldDef[];
}

export default function Login({ status, canResetPassword, fields }: LoginProps) {
  const { t } = useTranslation();

  const bottomLinks: ReactNode | undefined = canResetPassword ? (
    <TextLink
      href={route('password.request')}
      className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
    >
      {t('Forgot your password?')}
    </TextLink>
  ) : undefined;

  return (
    <AuthLayout title={t('Log in to your account')} description={t('Enter your username and password below to log in')}>
      <Head title={t('Log in')} />

      <div className="space-y-6">
        <AuthFormShell
          fields={fields}
          submitUrl={route('login')}
          submitLabel={t('Log in')}
          onSuccessRedirect={null}
          resetFieldsOnFinish={['password']}
          bottomLinks={bottomLinks}
          statusBanner={status ?? null}
          className="w-full"
        />

        <div className="text-muted-foreground text-center text-sm">
          {t("Don't have an account?")}{' '}
          <TextLink href={route('register')}>{t('Sign up')}</TextLink>
        </div>
      </div>
    </AuthLayout>
  );
}
