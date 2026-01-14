import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRTL } from '@/hooks/use-rtl';
import { useTranslation } from '@/lib/i18n';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
    const { locale } = usePage<SharedData>().props;
    const { isRTL } = useRTL();
    const { changeLocale, t } = useTranslation();

    const languages = [
        { code: 'en', name: t('English') },
        { code: 'ar', name: t('Arabic') },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Languages className={`h-5 w-5 ${isRTL ? 'rtl:rotate-180' : ''}`} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem key={lang.code} className={locale === lang.code ? 'bg-muted' : ''} onClick={() => changeLocale(lang.code)}>
                        <span className={lang.code === 'ar' ? 'w-full text-right' : ''}>{lang.name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
