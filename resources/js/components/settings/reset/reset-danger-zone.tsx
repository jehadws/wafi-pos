import { useTranslation } from '@/lib/i18n';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export function ResetDangerZone() {
  const { t } = useTranslation();

  return (
    <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-5 md:p-6">
      <div className="flex items-start gap-4">
        <div className="bg-destructive/10 text-destructive rounded-lg p-2.5">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-destructive flex items-center gap-2 text-base font-semibold">
              <span>{t('Destructive Action: Database Reset')}</span>
            </h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {t('Resetting the database wipes transactional and operational records. Please review what is affected before proceeding.')}
            </p>
          </div>

          <div className="grid gap-4 pt-1 text-xs sm:grid-cols-2 sm:text-sm">
            <div className="bg-background/60 space-y-1.5 rounded-lg border p-3">
              <div className="text-destructive flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-4 w-4" />
                <span>{t('Will be removed:')}</span>
              </div>
              <ul className="text-muted-foreground list-inside list-disc space-y-1">
                <li>{t('All sales orders & customer receipts')}</li>
                <li>{t('Procurements, products & inventory counts')}</li>
                <li>{t('Customers, coupons & reward balances')}</li>
                <li>{t('Expense transactions & register sessions')}</li>
              </ul>
            </div>

            <div className="bg-background/60 space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{t('Will be preserved:')}</span>
              </div>
              <ul className="text-muted-foreground list-inside list-disc space-y-1">
                <li>{t('Admin user accounts & authentication')}</li>
                <li>{t('Installed modules & database structure')}</li>
                <li>{t('System & currency core configurations')}</li>
                <li>{t('Server environment & file storage')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
