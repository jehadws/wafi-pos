import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';

export default function OrderProductCard({ orderProduct }: { orderProduct: TOrderProducts }) {
    const { t } = useTranslation();

    return (
        <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="font-medium">
                        {orderProduct.name} (x{orderProduct.quantity})
                    </span>
                    <span className="text-muted-foreground font-medium">
                        {t('Unit')}: {orderProduct.unit.name}
                    </span>
                </div>
                <span className="text-foreground text-xl font-bold">{formatCurrency(orderProduct.total_price)}</span>
            </div>
        </div>
    );
}
