import { Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, LogOut, Shield } from 'lucide-react';

export default function AccessDenied() {
  const { title = 'Access Denied', message, back } = usePage<{ title?: string, message?: string, back?: string }>().props;

  const retryUrl = new URL(window.location.href);
  const previousUrl =
    new URLSearchParams(retryUrl.search).get('back') || document.referrer;
  retryUrl.searchParams.set('back', previousUrl);

  return (
    <div className="h-full w-full h-screen overflow-y-auto pb-10 flex items-center justify-center">
      <div className="w-full md:w-1/2 lg:w-1/3 flex items-center flex-col justify-center">
        <span className="rounded-full text-6xl w-24 h-24 flex items-center justify-center bg-white shadow text-black mb-4">
          <Shield className="w-16 h-16" />
        </span>
        <h1 className="text-white text-center text-4xl font-bold">{title}</h1>
        <p className="py-3 text-white text-center text-lg">{message}</p>
        <div className="flex flex-wrap w-full gap-4 justify-center items-center mt-4">
          <div className="px-2 mb-2 w-full md:w-auto">
            <Button asChild className="w-full">
              <a href={back || document.referrer}>
                <ArrowLeft className="mr-1" />
                Go Back
              </a>
            </Button>
          </div>
          <div className="px-2 mb-2 w-full md:w-auto">
            <Button onClick={() => router.post(route('logout'))} className="w-full">
              <LogOut className="mr-1" />
              Log out
            </Button>
          </div>
          <div className="px-2 mb-2 w-full md:w-auto">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-1" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

