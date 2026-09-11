import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Home, LogOut, Shield } from 'lucide-react';

export default function AccessDenied() {
  const { t } = useTranslation();
  const { title = 'Access Denied', message, back } = usePage<{ title?: string; message?: string; back?: string }>().props;

  const retryUrl = new URL(window.location.href);
  const previousUrl = new URLSearchParams(retryUrl.search).get('back') || document.referrer;
  retryUrl.searchParams.set('back', previousUrl);

  return (
    <div className="flex h-full h-screen w-full items-center justify-center overflow-y-auto pb-10">
      <div className="flex w-full flex-col items-center justify-center md:w-1/2 lg:w-1/3">
        <span className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white text-6xl text-black shadow">
          <Shield className="h-16 w-16" />
        </span>
        <h1 className="text-center text-4xl font-bold text-white">{title}</h1>
        <p className="py-3 text-center text-lg text-white">{message}</p>
        <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-4">
          <div className="mb-2 w-full px-2 md:w-auto">
            <Button asChild className="w-full">
              <a href={back || document.referrer}>
                <ArrowLeft className="me-1" />
                {t('Go Back')}
              </a>
            </Button>
          </div>
          <div className="mb-2 w-full px-2 md:w-auto">
            <Button onClick={() => router.post(route('logout'))} className="w-full">
              <LogOut className="me-1" />
              {t('Logout')}
            </Button>
          </div>
          <div className="mb-2 w-full px-2 md:w-auto">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="me-1" />
                {t('Home')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
