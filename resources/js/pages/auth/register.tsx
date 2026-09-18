import { Head } from '@inertiajs/react';

import TextLink from '@/components/common/text-link';
import AuthFormShell from '@/components/auth/auth-form-shell';
import type { FormFieldDef } from '@/types/forms';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from '@/lib/i18n';

interface Props {
  fields: FormFieldDef[];
}

export default function Register({ fields }: Props) {
  const { t } = useTranslation();

  return (
    <AuthLayout title={t('Create an account')} description={t('Enter your details below to create your account')}>
      <Head title={t('Register')} />

      <div className="space-y-6">
        <AuthFormShell
          fields={fields}
          submitUrl={route('register')}
          submitLabel={t('Create account')}
          onSuccessRedirect={null}
          resetFieldsOnFinish={['password', 'password_confirmation']}
          className="w-full"
        />

        <div className="text-muted-foreground text-center text-sm">
          {t('Already have an account?')}{' '}
          <TextLink href={route('login')}>{t('Log in')}</TextLink>
        </div>
      </div>
    </AuthLayout>
  );
}
