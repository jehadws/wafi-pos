'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';
import { Bike, ShoppingBasket } from 'lucide-react';

interface OrderTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrderType: (type: 'takeaway' | 'delivery') => void;
}

export function OrderTypeDialog({ open, onOpenChange, onSelectOrderType }: OrderTypeDialogProps) {
  const { t } = useTranslation();

  const handleSelectType = (type: 'takeaway' | 'delivery') => {
    onSelectOrderType(type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground text-center text-lg font-semibold">{t('Define The Order Type')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-lg border">
          <button
            onClick={() => handleSelectType('takeaway')}
            className="group bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary relative flex flex-col items-center justify-center p-8 transition-colors focus:ring-offset-2 focus:outline-none"
          >
            <div className="relative mb-4">
              <div className="relative">
                <ShoppingBasket className="h-16 w-16 text-white" />
                <div className="absolute -end-2 -top-2 h-6 w-6 rounded-full bg-orange-400"></div>
                <div className="absolute start-2 -top-1 h-6 w-4 rounded-t-full bg-green-400"></div>
                <div className="absolute end-1 top-1 h-3 w-3 rounded-full bg-red-400"></div>
                <div className="absolute -start-1 top-2 h-4 w-5 rounded bg-yellow-300"></div>
              </div>
            </div>
            <span className="text-lg font-medium">{t('Take Away')}</span>
          </button>

          <button
            onClick={() => handleSelectType('delivery')}
            className="group bg-muted hover:bg-muted/70 text-foreground focus:ring-ring relative flex flex-col items-center justify-center p-8 transition-colors focus:ring-offset-2 focus:outline-none"
          >
            <div className="relative mb-4">
              <div className="relative">
                <Bike className="h-16 w-16 text-inherit" />
                <div className="absolute -start-2 -top-4 h-6 w-6 rounded-full bg-red-400"></div>
                <div className="absolute -start-1 -top-2 h-4 w-4 rounded-full bg-pink-300"></div>
                <div className="absolute -end-3 -top-1 h-3 w-4 rounded bg-red-500"></div>
              </div>
            </div>
            <span className="text-lg font-medium">{t('Delivery')}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
