import { useAppearance } from '@/hooks/use-appearance';
import { useTranslation } from '@/lib/i18n';
import { MoonIcon, SunIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ModeToggleButton() {
    const { appearance, updateAppearance } = useAppearance();
    const { t } = useTranslation();

    const themeToggle = () => {
        if (appearance === 'light') {
            updateAppearance('dark');
        } else {
            updateAppearance('light');
        }
    };

    return (
        <Button type="button" variant="ghost" className="relative" size="icon" onClick={themeToggle}>
            <SunIcon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">{t('Toggle theme')}</span>
        </Button>
    );
}
