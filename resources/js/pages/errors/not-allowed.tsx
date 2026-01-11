import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface NotAllowedProps {
    title: string;
    message: string;
    back: string;
}

export default function NotAllowed({ title, message, back }: NotAllowedProps) {
    const { t } = useTranslation();
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <Head title={title} />

            <div className="w-full max-w-md space-y-6 text-center">
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>

                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/50">
                    <p className="text-red-700 dark:text-red-400">{message}</p>
                </div>

                {back && (
                    <Button variant="outline" onClick={() => (window.location.href = back)} className="inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        {t('Go Back')}
                    </Button>
                )}
            </div>
        </div>
    );
}
