'use client';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { Frown, Plus } from 'lucide-react';

interface EmptyStateProps {
  onCreateCategories: () => void;
}

export default function EmptyState({ onCreateCategories }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <Frown className="text-muted-foreground/60 h-10 w-10" />
      <h3 className="mt-4 text-lg font-semibold">{t('No products or categories')}</h3>
      <p className="text-muted-foreground mt-2 text-sm">
        {t('Looks like there is either no products and no categories. How about creating those first to get started?')}
      </p>
      <Button className="mt-4" onClick={onCreateCategories}>
        <Plus className="me-2 h-4 w-4" />
        {t('Create Categories')}
      </Button>
    </div>
  );
}
