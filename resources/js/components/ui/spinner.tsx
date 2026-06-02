import { useTranslation } from "@/lib/i18n"

export default function Spinner() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ms-2 text-muted-foreground">{t('Loading...')}</span>
    </div>
  )
}

