import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/format';
import { useTranslation } from '../../../lib/i18n';

type Props = {
    order: Order | null;
};

export default function OrderPaymentsTab({ order }: Props) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div className="flex items-center justify-between rounded border border-sky-500/60 bg-sky-500/30 p-3">
                        <span className="font-medium">{t('Total')}</span>
                        <span className="font-semibold">{formatCurrency(order?.total || 0)}</span>
                    </div>
                    <div className="bg-error/30 border-error flex items-center justify-between rounded border p-3">
                        <span className="font-medium">{t('Unpaid')}</span>
                        <span className="font-semibold">{formatCurrency(order?.change || 0)}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="bg-success/30 border-success/60 flex items-center justify-between rounded border p-3">
                        <span className="font-medium">{t('Paid')}</span>
                        <span className="font-semibold">{formatCurrency(order?.tendered || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded border border-yellow-500/60 bg-yellow-500/50 p-3">
                        <span className="font-medium">{t('Customer Account')}</span>
                        <span className="font-semibold">{formatCurrency(order?.customer.account_amount || 0)}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div>{t('Payment History')}</div>
                <Separator />
                <div className="max-h-[300px] overflow-y-auto">
                    {order?.payments?.map((pay) => (
                        <div key={pay.id} className="bg-muted/40 border-muted flex items-center justify-between rounded border p-3">
                            <span className="font-medium">{t(pay.identifier)}</span>
                            <span className="font-semibold">{formatCurrency(pay.value || 0)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
