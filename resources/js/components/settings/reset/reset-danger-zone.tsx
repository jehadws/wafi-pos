import { AlertTriangle, Database, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function ResetDangerZone() {
    const { t } = useTranslation();

    return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 md:p-6">
            <div className="flex items-start gap-4">
                <div className="rounded-lg bg-destructive/10 p-2.5 text-destructive">
                    <ShieldAlert className="h-6 w-6" />
                </div>
                <div className="space-y-3 flex-1">
                    <div>
                        <h3 className="text-base font-semibold text-destructive flex items-center gap-2">
                            <span>{t('Destructive Action: Database Reset')}</span>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {t(
                                'Resetting the database wipes transactional and operational records. Please review what is affected before proceeding.'
                            )}
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 pt-1 text-xs sm:text-sm">
                        <div className="rounded-lg border bg-background/60 p-3 space-y-1.5">
                            <div className="font-medium text-destructive flex items-center gap-1.5">
                                <AlertTriangle className="h-4 w-4" />
                                <span>{t('Will be removed:')}</span>
                            </div>
                            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                                <li>{t('All sales orders & customer receipts')}</li>
                                <li>{t('Procurements, products & inventory counts')}</li>
                                <li>{t('Customers, coupons & reward balances')}</li>
                                <li>{t('Expense transactions & register sessions')}</li>
                            </ul>
                        </div>

                        <div className="rounded-lg border bg-background/60 p-3 space-y-1.5">
                            <div className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>{t('Will be preserved:')}</span>
                            </div>
                            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
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
