import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { ArrowRight, Loader2 } from 'lucide-react';

interface StepActionsProps {
    current: number;
    total: number;
    onBack?: () => void;
    onNext: () => void;
    nextLabel?: string;
    nextLoading?: boolean;
    nextDisabled?: boolean;
}

export function StepActions({ current, total, onBack, onNext, nextLabel = 'Continue', nextLoading = false, nextDisabled = false }: StepActionsProps) {
    const { t } = useTranslation();

    return (
        <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-5">
            <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-500">
                {t('Step {current} of {total}', { current: current + 1, total })}
            </span>
            <div className="flex gap-2">
                {onBack && (
                    <Button variant="outline" size="sm" onClick={onBack}>
                        {t('Back')}
                    </Button>
                )}
                <Button size="sm" onClick={onNext} disabled={nextLoading || nextDisabled} className="gap-1.5">
                    {nextLoading && <Loader2 size={13} className="animate-spin" />}
                    {t(nextLabel)}
                    {!nextLoading && <ArrowRight size={13} />}
                </Button>
            </div>
        </div>
    );
}
