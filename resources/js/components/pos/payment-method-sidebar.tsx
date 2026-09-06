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
    <div className="border-border w-full shrink-0 border-b lg:h-full lg:w-48 lg:border-b-0 lg:border-e">
      {/* Horizontal scroll rail on narrow sheets, vertical rail on lg+ */}
      <div className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
        {paymentsType.map((payment: PaymentType) => (
          <button
            key={payment.identifier}
            onClick={() => onTabSelect(payment)}
            className={cn(
              'text-foreground relative w-full min-w-[120px] shrink-0 rounded-lg px-3 py-2.5 text-start text-sm transition-colors lg:min-w-0',
              isSelected(payment) ? 'text-primary bg-primary/10 font-medium shadow-sm' : 'hover:bg-muted/60',
            )}
          >
            {payment.label}
          </button>
        ))}

        <button
          key={'list'}
          onClick={() => onTabSelect('payment-list')}
          className={cn(
            'text-foreground relative w-full min-w-[120px] shrink-0 rounded-lg px-3 py-2.5 text-start text-sm transition-colors lg:min-w-0',
            selectedTab === 'payment-list' ? 'text-primary bg-primary/10 font-medium shadow-sm' : 'hover:bg-muted/60',
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
