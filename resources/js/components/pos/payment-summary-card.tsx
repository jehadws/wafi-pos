import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';

interface SummaryCardProps {
  label: string;
  amount: number;
  variant: 'total' | 'discount' | 'paid' | 'change';
  isNegative?: boolean;
}

export default function SummaryCard({ label, amount, variant, isNegative = false }: SummaryCardProps) {
  const { t } = useTranslation();

  const getLabel = () => {
    switch (label) {
      case 'Total':
        return t('Total');
      case 'Discount':
        return t('Discount');
      case 'Paid':
        return t('Paid');
      case 'Change':
        return t('Change');
      default:
        return label;
    }
  };

  const variants = {
    total: 'bg-primary/10 border-primary/20',
    discount: 'bg-muted/60 border-border',
    paid: 'bg-primary/10 border-primary/20',
    change: 'bg-muted/60 border-border',
  };

  return (
    <div className={cn('rounded-lg border p-4', variants[variant])}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground font-medium">{getLabel()} :</span>
        <span className="text-foreground text-xl font-bold">
          {isNegative && amount < 0 ? `-${formatCurrency(Math.abs(amount))}` : formatCurrency(amount)}
        </span>
      </div>
    </div>
  );
}
