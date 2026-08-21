import { useTranslation } from '@/lib/i18n';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
  const { auth } = usePage<SharedData>().props;
  const { t } = useTranslation();

  return (
    <>
      <Head title={t('Welcome')} />

      <div className="relative flex h-screen w-screen select-none flex-col items-center justify-center overflow-hidden bg-background font-sans text-foreground">
        {/* faint dot-grid, evokes receipt/graph paper without introducing a new color */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 40%, black 0%, transparent 75%)',
          }}
        />

        {/* soft glow behind the card, using the theme's own primary at low opacity */}
        <div
          className="pointer-events-none absolute h-[520px] w-[520px] rounded-full bg-primary opacity-[0.08] blur-3xl"
          aria-hidden
        />

        <div className="relative flex w-full max-w-sm flex-col items-center rounded-xl border border-border bg-card px-10 py-12 text-center shadow-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-primary shadow-sm">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="7" width="18" height="13" rx="2" className="stroke-primary-foreground" strokeWidth="1.8" />
              <path d="M8 7V5a4 4 0 0 1 8 0v2" className="stroke-primary-foreground" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M3 11h18" className="stroke-primary-foreground" strokeWidth="1.8" />
            </svg>
          </div>

          <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-card-foreground">Wafi</h1>
          <p className="mb-8 max-w-[15rem] text-sm leading-relaxed text-muted-foreground">
            Your point of sale, ready when you are. Sign in to open the till.
          </p>

          <div className="flex w-full flex-col gap-2.5">
            {auth.user ? (
              <Link
                href={route('dashboard')}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {t('Go to Dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href={route('login')}
                  className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {t('Login')}
                </Link>
                <Link
                  href={route('register')}
                  className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {t('Register')}
                </Link>
              </>
            )}
          </div>

          <div className="mt-8 flex w-full items-center gap-3 border-t border-border pt-5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            <span className="font-mono text-[11px] tracking-wide text-muted-foreground">v1.0.0 · Ready offline</span>
          </div>
        </div>
      </div>
    </>
  );
}