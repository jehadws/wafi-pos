import { useTranslation } from '@/lib/i18n';

export default function Categories() {
    const { t } = useTranslation();
    return <div>{t('Categories')}</div>;
}
