import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { PAYMENT_METHODS } from './payment-gateway-dialog';

interface PaymentMethodSidebarProps {
  selectedTab: PaymentTypes | 'payment-list';
  onTabSelect: (method: PaymentTypes | 'payment-list') => void;
  totalPayment: number;
}

export function PaymentMethodSidebar({ selectedTab, onTabSelect, totalPayment }: PaymentMethodSidebarProps) {
  const { t } = useTranslation();

  return (
    <div className="border-border h-full w-48 border-r">
      <div className="space-y-1 p-2">
        {Object.entries(PAYMENT_METHODS).map(([identifier, label]) => (
          <button
            key={identifier}
            onClick={() => onTabSelect(identifier)}
            className={cn(
              'text-foreground relative w-full rounded px-3 py-2 text-left text-sm',
              selectedTab === identifier ? 'text-primary bg-primary/10 shadow-sm' : 'hover:bg-muted/60',
            )}
          >
            {label}
          </button>
        ))}

        <button
          key={'list'}
          onClick={() => onTabSelect('payment-list')}
          className={cn(
            'text-foreground relative w-full rounded px-3 py-2 text-left text-sm',
            selectedTab === 'payment-list' ? 'text-primary bg-primary/10 shadow-sm' : 'hover:bg-muted/60',
          )}
        >
          {t('List Of Payments')}
          <span className="bg-primary text-primary-foreground absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-xs">
            {totalPayment}
          </span>
        </button>
      </div>
    </div>
  );
}
