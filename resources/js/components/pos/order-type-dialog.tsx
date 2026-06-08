import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { Bike, ShoppingBasket } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

interface OrderTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrderType: (type: OrderTypeObj) => void;
  orderType: OrderTypeObj | null;
}

export function OrderTypeDialog({ open, onOpenChange, orderType, onSelectOrderType }: OrderTypeDialogProps) {
  const { t } = useTranslation();
  const { options } = usePage<{ options: NsPosOptions }>().props;
  const enabledTypes = options.ns_jgrem_order_types || [];

  const handleSelectType = (type: 'takeaway' | 'delivery') => {
    if (type === 'takeaway') {
      onSelectOrderType({ identifier: 'takeaway', label: t('Take Away'), icon: '/images/groceries.png', selected: true });
    } else {
      onSelectOrderType({ identifier: 'delivery', label: t('Delivery'), icon: '/images/delivery.png', selected: true });
    }
    onOpenChange(false);
  };

  const showTakeaway = enabledTypes.includes('takeaway');
  const showDelivery = enabledTypes.includes('delivery');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">{t('Define The Order Type')}</DialogTitle>
        </DialogHeader>

        <div className={cn("grid gap-0 overflow-hidden rounded-lg border", (showTakeaway && showDelivery) ? "grid-cols-2" : "grid-cols-1")}>
          {/* Take Away Option */}
          {showTakeaway && (
            <button
              onClick={() => handleSelectType('takeaway')}
              className={cn(
                'group hover:bg-primary/80 relative flex flex-col items-center justify-center p-8 transition-colors focus:ring-blue-500 focus:outline-none',
                orderType?.identifier === 'takeaway' ? 'bg-primary' : '',
              )}
            >
              <div className="relative mb-4">
                {/* Shopping basket with groceries illustration */}
                <div className="relative">
                  <ShoppingBasket className="h-16 w-16 text-white" />
                  {/* Decorative food items */}
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-orange-400"></div>
                  <div className="absolute -top-1 left-2 h-6 w-4 rounded-t-full bg-green-400"></div>
                  <div className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="absolute top-2 -left-1 h-4 w-5 rounded bg-yellow-300"></div>
                </div>
              </div>
              <span className="text-lg font-medium">{t('Take Away')}</span>
            </button>
          )}

          {/* Delivery Option */}
          {showDelivery && (
            <button
              onClick={() => handleSelectType('delivery')}
              className={cn(
                'group hover:bg-primary/80 relative flex flex-col items-center justify-center p-8 transition-colors focus:ring-blue-500 focus:outline-none',
                orderType?.identifier === 'delivery' ? 'bg-primary' : '',
              )}
            >
              <div className="relative mb-4">
                {/* Delivery scooter illustration */}
                <div className="relative">
                  <Bike className="h-16 w-16 text-red-500" />
                  {/* Delivery person */}
                  <div className="absolute -top-4 -left-2 h-6 w-6 rounded-full bg-red-400"></div>
                  <div className="absolute -top-2 -left-1 h-4 w-4 rounded-full bg-pink-300"></div>
                  {/* Delivery box */}
                  <div className="absolute -top-1 -right-3 h-3 w-4 rounded bg-red-500"></div>
                </div>
              </div>
              <span className="text-lg font-medium">{t('Delivery')}</span>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
