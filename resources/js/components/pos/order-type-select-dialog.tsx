'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';
import { Bike, ShoppingBasket } from 'lucide-react';
import { useState } from 'react';

interface OrderTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrderType: (type: 'takeaway' | 'delivery') => void;
}

export function OrderTypeDialog({ open, onOpenChange, onSelectOrderType }: OrderTypeDialogProps) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<'takeaway' | 'delivery' | null>(null);

  const handleSelectType = (type: 'takeaway' | 'delivery') => {
    setSelectedType(type);
    onSelectOrderType(type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold text-gray-800">{t('Define The Order Type')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-lg border">
          <button
            onClick={() => handleSelectType('takeaway')}
            className="group relative flex flex-col items-center justify-center bg-blue-500 p-8 text-white transition-colors hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            <div className="relative mb-4">
              <div className="relative">
                <ShoppingBasket className="h-16 w-16 text-white" />
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-orange-400"></div>
                <div className="absolute -top-1 left-2 h-6 w-4 rounded-t-full bg-green-400"></div>
                <div className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-400"></div>
                <div className="absolute top-2 -left-1 h-4 w-5 rounded bg-yellow-300"></div>
              </div>
            </div>
            <span className="text-lg font-medium">{t('Take Away')}</span>
          </button>

          <button
            onClick={() => handleSelectType('delivery')}
            className="group relative flex flex-col items-center justify-center bg-gray-50 p-8 text-gray-800 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
          >
            <div className="relative mb-4">
              <div className="relative">
                <Bike className="h-16 w-16 text-red-500" />
                <div className="absolute -top-4 -left-2 h-6 w-6 rounded-full bg-red-400"></div>
                <div className="absolute -top-2 -left-1 h-4 w-4 rounded-full bg-pink-300"></div>
                <div className="absolute -top-1 -right-3 h-3 w-4 rounded bg-red-500"></div>
              </div>
            </div>
            <span className="text-lg font-medium">{t('Delivery')}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
