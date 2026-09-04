import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import React from 'react';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    hint?: string;
    error?: string;
    containerClassName?: string;
}

export function FormField({
    label,
    hint,
    error,
    containerClassName,
    className,
    ...props
}: FormFieldProps) {
    const { t } = useTranslation();

    return (
        <div className={cn('flex flex-col gap-1.5', containerClassName)}>
            <Label className="text-[12px] font-medium text-zinc-400">{t(label)}</Label>
            <Input {...props} className={className} />
            {hint && <p className="text-[11px] text-zinc-600">{t(hint)}</p>}
            {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
    );
}
