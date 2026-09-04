import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { STEPS } from '../config';
import { StepConfig } from '../types';

interface StepIndicatorProps {
    step: StepConfig;
    current: number;
    onClick: () => void;
}

export function StepIndicator({ step, current, onClick }: StepIndicatorProps) {
    const { t } = useTranslation();
    const done = step.id < current;
    const active = step.id === current;

    return (
        <li className="relative">
            {/* Connector line */}
            {step.id < STEPS.length - 1 && (
                <span className={cn('absolute top-8 left-[10px] h-[calc(100%-4px)] w-px', done ? 'bg-violet-500/40' : 'bg-zinc-800')} />
            )}

            <button
                onClick={onClick}
                className={cn(
                    'relative z-10 flex w-full items-start gap-3 rounded-lg px-2 py-2 text-start transition-colors',
                    active && 'bg-violet-500/10',
                    !active && !done && 'hover:bg-zinc-900',
                )}
            >
                {/* Dot */}
                <span
                    className={cn(
                        'mt-0.5 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-all',
                        done && 'border-violet-500/60 bg-violet-500/20 text-violet-400',
                        active && 'border-violet-500 bg-violet-500 text-white shadow-[0_0_0_3px_rgba(139,92,246,0.2)]',
                        !done && !active && 'border-zinc-700 bg-zinc-900 text-zinc-500',
                    )}
                >
                    {done ? <CheckCircle2 size={11} /> : step.id + 1}
                </span>

                {/* Label */}
                <span className="flex flex-col gap-0.5 pt-[1px]">
                    <span className={cn('text-[12px] leading-tight font-medium', active ? 'text-zinc-100' : 'text-zinc-500')}>{t(step.label)}</span>
                    {step.description && <span className="text-[11px] leading-tight text-zinc-600">{t(step.description)}</span>}
                </span>
            </button>
        </li>
    );
}
