import { useTranslation } from '@/lib/i18n';
import AppLogoIcon from '@/components/common/app-logo-icon';
import Settings from '@/lib/settings';

export default function AppLogo() {
    const { t } = useTranslation();
    const storeName = Settings.get()?.identification?.sb_store_name || 'Subul';
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden shrink-0">
                <AppLogoIcon className="size-8 object-contain" />
            </div>
            <div className="ms-1 grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">{t(storeName)}</span>
            </div>
        </>
    );
}
