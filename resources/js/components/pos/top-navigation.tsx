'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/lib/i18n';
import { Barcode, Home, Percent } from 'lucide-react';

interface TopNavigationProps {
  isListeningForBarcodes: boolean;
  toggleBarcodeListening: () => void;
  applyAutoMargin: () => void;
}

export default function TopNavigation({ isListeningForBarcodes, toggleBarcodeListening, applyAutoMargin }: TopNavigationProps) {
  const { t } = useTranslation();
  return (
    <header className="bg-card border-b px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{t('POS System')}</h1>
        </div>
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Switch id="barcode-mode" checked={isListeningForBarcodes} onCheckedChange={toggleBarcodeListening} />
                  <Label htmlFor="barcode-mode" className="flex cursor-pointer items-center">
                    <Barcode className="me-1 h-4 w-4" />
                    {t('Barcode Mode')}
                    {isListeningForBarcodes && (
                      <Badge variant="outline" className="ms-2 border-green-200 bg-green-100 text-green-800">
                        {t('Active')}
                      </Badge>
                    )}
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('When enabled, automatically adds scanned items to cart')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={applyAutoMargin} className="flex items-center">
                  <Percent className="me-2 h-4 w-4" />
                  {t('Auto-Margin')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Apply consistent margin to same items')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" size="sm">
            <Home className="me-2 h-4 w-4" />
            {t('Home')}
          </Button>
        </div>
      </div>
    </header>
  );
}
