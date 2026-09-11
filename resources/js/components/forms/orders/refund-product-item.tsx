import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Settings, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../lib/i18n';

type Condition = {
  value: string;
  label: string;
};

type Props = {
  product: Product;
  conditions: Condition[];
  onQuantityClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function RefundProductItem({ product, conditions, onQuantityClick, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const conditionLabel = t(conditions.find((c) => c.value === product.condition)?.label || '');

  return (
    <div className="bg-muted/30 flex items-stretch justify-between border">
      <div className="flex flex-col gap-2 p-2">
        <span className="font-normal">
          {product.name} <Badge variant="secondary">{conditionLabel}</Badge>
        </span>
        <span className="text-sm font-normal">{product.unit?.name}</span>
      </div>

      <div className="flex items-stretch">
        <Button size="icon" variant="ghost" className="aspect-square h-full w-16 rounded-none border-r" onClick={onQuantityClick}>
          {product.quantity}
        </Button>
        <Button size="icon" variant="ghost" className="aspect-square h-full w-16 rounded-none border-r" onClick={onEdit}>
          <Settings />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className={cn('hover:bg-danger/30 dark:hover:bg-danger/30 aspect-square h-full w-16 rounded-none border-r')}
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
