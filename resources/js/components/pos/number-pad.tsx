'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { Delete } from 'lucide-react';

interface NumberPadProps {
    onNumberClick: (num: string) => void;
    onBackspace: () => void;
    onConfirm: () => void;
    handleFullPayment: () => void;
}

interface NumberButtonProps {
    children: React.ReactNode;
    onClick: () => void;
}

function NumberButton({ children, onClick }: NumberButtonProps) {
    return (
        <Button variant="outline" size="lg" className="text-foreground h-16 bg-transparent text-xl font-semibold" onClick={onClick}>
            {children}
        </Button>
    );
}

export function NumberPad({ onNumberClick, onBackspace, onConfirm, handleFullPayment }: NumberPadProps) {
    const { t } = useTranslation();
    const numbers = [
        ['7', '8', '9'],
        ['4', '5', '6'],
        ['1', '2', '3'],
    ];

    return (
        <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
            {/* Number rows */}
            {numbers.map((row, rowIndex) =>
                row.map((num) => (
                    <NumberButton key={num} onClick={() => onNumberClick(num)}>
                        {num}
                    </NumberButton>
                )),
            )}

            {/* Bottom row */}
            <NumberButton onClick={onBackspace}>
                <Delete className="h-6 w-6" />
            </NumberButton>
            <NumberButton onClick={() => onNumberClick('0')}>0</NumberButton>
            <NumberButton onClick={onConfirm}>{t('Enter')}</NumberButton>

            {/* Full Payment Button */}
            <div className="col-span-3">
                <Button
                    onClick={handleFullPayment}
                    className="h-16 w-full bg-green-500 text-lg font-semibold text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                >
                    {t('Full Payment')}
                </Button>
            </div>
        </div>
    );
}
