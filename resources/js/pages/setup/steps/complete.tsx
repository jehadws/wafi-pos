import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function CompletePage({ storeName, adminUsername }: { storeName?: string; adminUsername?: string }) {
  const { t } = useTranslation();

  const goToDashboard = () => {
    // Clear wizard progress so the setup page doesn't resume at #/complete if revisited.
    sessionStorage.removeItem('setup_wizard_step');
    // Use a full-page navigation so the server re-evaluates the now-authenticated session.
    window.location.href = route('sb.dashboard.home');
  };

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>

        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-zinc-100">{t('Installation complete')}</h1>
          <p className="mt-1.5 text-[13px] text-zinc-500">{t("Subul is ready. Here's a summary of what was set up.")}</p>
        </div>

        <div className="grid w-full max-w-xs grid-cols-2 gap-2">
          {[
            { label: t('Database'), value: t('Connected'), ok: true },
            { label: t('Migrations'), value: t('Applied'), ok: true },
            { label: t('Store'), value: storeName ?? t('My Store'), ok: false },
            { label: t('Admin'), value: adminUsername || 'admin', ok: false, mono: true },
          ].map((chip) => (
            <div key={chip.label} className="flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5">
              <span className="text-[10px] font-medium tracking-wider text-zinc-600 uppercase">{chip.label}</span>
              <span className={cn('text-[13px] font-medium', chip.ok ? 'text-emerald-400' : 'text-zinc-200', chip.mono && 'font-mono text-[12px]')}>
                {chip.value}
                {chip.ok && ' ✓'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 border-t border-zinc-800 pt-5">
        <Button variant="outline" size="sm" asChild>
          <a href="https://my.subul.com/en/documentation" target="_blank" rel="noreferrer">
            {t('View documentation')}
          </a>
        </Button>
        <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-500" onClick={goToDashboard}>
          {t('Go to dashboard')} <ArrowRight size={13} />
        </Button>
      </div>
    </>
  );
}
