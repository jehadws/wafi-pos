import { PaymentType } from '@/types/models/payment-type';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface PaymentMethodSidebarProps {
  selectedTab: PaymentType | 'payment-list';
  onTabSelect: (method: PaymentType | 'payment-list') => void;
  totalPayment: number;
  paymentsType: PaymentType[];
}

export function PaymentMethodSidebar({ selectedTab, onTabSelect, totalPayment, paymentsType }: PaymentMethodSidebarProps) {
  const { t } = useTranslation();

  const isSelected = (payment: PaymentType) =>
    selectedTab !== 'payment-list' && selectedTab.identifier === payment.identifier;

  return (
    <div className="border-border h-full w-48 border-r">
      <div className="space-y-1 p-2">
        {paymentsType.map((payment: PaymentType) => (
          <button
            key={payment.identifier}
            onClick={() => onTabSelect(payment)}
            className={cn(
              'text-foreground relative w-full rounded px-3 py-2 text-start text-sm',
              isSelected(payment) ? 'text-primary bg-primary/10 shadow-sm' : 'hover:bg-muted/60',
            )}
          >
            {payment.label}
          </button>
        ))}

        <button
          key={'list'}
          onClick={() => onTabSelect('payment-list')}
          className={cn(
            'text-foreground relative w-full rounded px-3 py-2 text-start text-sm',
            selectedTab === 'payment-list' ? 'text-primary bg-primary/10 shadow-sm' : 'hover:bg-muted/60',
          )}
        >
          {t('List Of Payments')}
          <span className="bg-primary text-primary-foreground absolute top-1/2 end-2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-xs">
            {totalPayment}
          </span>
        </button>
      </div>
    </div>
  );
}
