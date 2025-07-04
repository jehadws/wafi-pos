import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRTL } from '@/hooks/use-rtl';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
    const { locale } = usePage<SharedData>().props;
    const { isRTL } = useRTL();

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'ar', name: 'العربية' },
    ];

    const changeLanguage = (langCode: string) => {
        // Send a request to change the language
        window.axios
            .post('/set-locale', {
                locale: langCode,
            })
            .then(() => {
                // Reload the page to apply the new language
                window.location.reload();
            });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Languages className={`h-5 w-5 ${isRTL ? 'rtl:rotate-180' : ''}`} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem key={lang.code} className={locale === lang.code ? 'bg-muted' : ''} onClick={() => changeLanguage(lang.code)}>
                        <span className={lang.code === 'ar' ? 'w-full text-right' : ''}>{lang.name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
