'use client';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface ToggleButtonsProps {
    value: boolean;
    onChange: (value: boolean) => void;
    trueLabel?: string;
    falseLabel?: string;
    className?: string;
}

export default function ToggleButtons({ value, onChange, trueLabel, falseLabel, className = '' }: ToggleButtonsProps) {
    const { t } = useTranslation();
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Button type="button" variant={value ? 'outline' : 'default'} className="border" onClick={() => onChange(false)}>
                {falseLabel || t('No')}
            </Button>
            <Button type="button" variant={value ? 'default' : 'outline'} className="border" onClick={() => onChange(true)}>
                {trueLabel || t('Yes')}
            </Button>
        </div>
    );
}
