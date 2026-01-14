import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n';

type Props = {
    options: { isOpen: boolean; id: number | null };
    setOptions: (value: { isOpen: boolean; id: number | null }) => void;
};

export default function OrderOptionsDialog({ options, setOptions }: Props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);

    const handleFetchOrder = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/orders/${options.id}`);
            console.log('Order', res.data);
            setOrder(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (options.id) {
            handleFetchOrder();
        }
    }, [options.id]);

    return (
        <Dialog open={options.isOpen} onOpenChange={() => setOptions({ ...options, isOpen: false })}>
            <DialogContent className={cn('flex h-[80vh] max-h-[80vh] w-[70vw] max-w-[70vw] flex-col sm:max-h-[80vh] sm:max-w-[70vw]')}>
                <DialogTitle>{t('Order Options')}</DialogTitle>
                <DialogDescription className="sr-only">{t('Order Options')}</DialogDescription>
                <div>
                    <h3 className="mb-4 text-lg font-semibold">{t('Payment Summary')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Left Column */}
                        <div className="space-y-3">
                            <div className="bg-muted flex items-center justify-between rounded border p-3">
                                <span className="font-medium">{t('Sub Total')}</span>
                                <span className="font-semibold">{formatCurrency(order?.subtotal || 0)}</span>
                            </div>
                            <div className="bg-primary/60 border-primary flex items-center justify-between rounded border p-3">
                                <span className="font-medium">{t('Shipping')}</span>
                                <span className="font-semibold">{formatCurrency(order?.shipping || 0)}</span>
                            </div>
                            <div className="bg-success/60 border-success flex items-center justify-between rounded border p-3">
                                <span className="font-medium">{t('Total')}</span>
                                <span className="font-semibold">{formatCurrency(order?.total || 0)}</span>
                            </div>
                            <div className="bg-danger/50 border-danger flex items-center justify-between rounded border p-3">
                                <span className="font-medium">{t('Change')}</span>
                                <span className="font-semibold">{formatCurrency(order?.change || 0)}</span>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-3">
                            <div className="bg-error/30 border-error/60 flex items-center justify-between rounded border p-3">
                                <span className="font-medium">{t('Discount')}</span>
                                <span className="font-semibold">{formatCurrency(order?.discount || 0)}</span>
                            </div>
                            <div className="bg-muted flex items-center justify-between rounded border p-3">
                                <span className="font-medium">{t('Coupons')}</span>
                                <span className="font-semibold">{formatCurrency(order?.total_coupons || 0)}</span>
                            </div>
                            <div className="bg-muted flex items-center justify-between rounded border p-3">
                                <span className="font-medium">{t('Taxes')}</span>
                                <span className="font-semibold">{formatCurrency(order?.tax_value || 0)}</span>
                            </div>
                            <div className="bg-info/60 border-info flex items-center justify-between rounded border p-3">
                                <span className="font-medium">{t('Paid')}</span>
                                <span className="font-semibold">{formatCurrency(order?.tendered || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Order Status */}
                    <div>
                        <h3 className="mb-4 text-lg font-semibold">{t('Order Status')}</h3>
                        <div className="space-y-3">
                            <div className="bg-muted flex items-center justify-between rounded p-3">
                                <span className="font-medium">{t('Customer')}</span>
                                <span className="font-semibold">
                                    {order?.customer.first_name} {order?.customer.last_name || ''}
                                </span>
                            </div>
                            <div className="bg-muted flex items-center justify-between rounded p-3">
                                <span className="font-medium">{t('Type')}</span>
                                <span className="font-semibold">{order?.type}</span>
                            </div>
                            <div className="bg-muted flex items-center justify-between rounded p-3">
                                <span className="font-medium">{t('Delivery Status')}</span>
                                <span className="font-semibold">
                                    {order?.delivery_status === 'not-available' ? 'Not Available' : order?.delivery_status}
                                </span>
                            </div>
                            <div className="bg-muted flex items-center justify-between rounded p-3">
                                <span className="font-medium">{t('Processing Status')}</span>
                                <span className="font-semibold">
                                    {order?.process_status === 'not-available' ? 'Not Available' : order?.process_status}
                                </span>
                            </div>
                            <div className="bg-muted flex items-center justify-between rounded p-3">
                                <span className="font-medium">{t('Payment Status')}</span>
                                <span className="font-semibold">{order?.payment_status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div>
                        <h3 className="mb-4 text-lg font-semibold">{t('Products')}</h3>
                        <div className="space-y-3">
                            {order?.products?.map((product) => (
                                <div key={product.id} className="bg-muted flex items-center justify-between rounded p-3">
                                    <div>
                                        <div className="font-medium">
                                            {product.name} (x{product.quantity})
                                        </div>
                                        <div className="text-sm">{product.unit_name}</div>
                                    </div>
                                    <span className="font-semibold">{formatCurrency(product.total_price)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Refunded Products */}
                        <div className="mt-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">{t('Refund With Products')}</h3>
                                <span className="text-sm font-medium">{t('All Refunds')}</span>
                            </div>
                            {order?.refunded_products?.length === 0 ? (
                                <div className="rounded p-3 text-center">{t('Nothing to display')}</div>
                            ) : (
                                <div className="space-y-3">
                                    {order?.refunded_products?.map((product, index) => (
                                        <div key={index} className="flex items-center justify-between rounded p-3">
                                            <div>
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-sm">{product.unit_name}</div>
                                            </div>
                                            <span className="font-semibold">{formatCurrency(product.total_price)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-auto">
                    <div className="mt-2 flex w-full flex-row items-center justify-end">
                        <Button onClick={() => {}} variant={'default'}>
                            {t('Print')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
