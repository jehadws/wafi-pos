import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ordersApi } from '@/api';
import printAgentService from '@/services/print-agent-service';
import { LoaderCircle, Printer, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useOrder } from '@/hooks/use-order';
import { useTranslation } from '@/lib/i18n';
import OrderDetailsTab from './order-details-tab';
import OrderInstalmentsTab from './order-instalments-tab';
import OrderPaymentsTab from './order-payments-tab';
import OrderRefundTab from './order-refund-tab';

type Props = {
    open: boolean;
    orderId: number | null;
    onOpenChange: (open: boolean) => void;
};

export default function OrderOptionsDialog({ open, orderId, onOpenChange }: Props) {
    const { t } = useTranslation();
    const { order, loading, refetch, clear } = useOrder(orderId);
    const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
    const [voidReason, setVoidReason] = useState('');
    const [isVoiding, setIsVoiding] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const paymentStatus = order?.payment_status;
    const isFinalized = paymentStatus === 'refunded' || paymentStatus === 'order_void';
    const canAcceptPayments = paymentStatus !== 'partially_refunded' && !isFinalized;

    const handlePrint = async () => {
        if (!order || isPrinting) return;
        setIsPrinting(true);
        try {
            const receiptOrder = order as unknown as Parameters<typeof printAgentService.printOrderReceipt>[0];
            const result = await printAgentService.printOrderReceipt(receiptOrder);
            if (result.success) {
                toast.success(t('The receipt has been sent to the printer.'));
            } else {
                toast.error(t('Unable to print'), { description: result.error });
            }
        } catch (error) {
            toast.error(t('Unable to print'), { description: printAgentService.formatErrorMessage(error) });
        } finally {
            setIsPrinting(false);
        }
    };

    const handleDialogChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            clear();
            setVoidReason('');
            setIsVoidDialogOpen(false);
        }
        onOpenChange(nextOpen);
    };

    const handleVoidOrder = async () => {
        if (isVoiding || !orderId) return;
        setIsVoiding(true);
        try {
            await ordersApi.void(orderId, { reason: voidReason.trim() });
            toast.success(t('The order has been voided.'));
            setIsVoidDialogOpen(false);
            setVoidReason('');
            refetch();
        } catch {
            toast.error(t('Something went wrong. Please try again'));
        } finally {
            setIsVoiding(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleDialogChange}>
                <DialogContent className={cn('flex h-[90vh] max-h-[90vh] w-[90vw] max-w-[90vw] flex-col sm:max-h-[90vh] sm:max-w-[90vw]')}>
                    <DialogHeader>
                        <DialogTitle>{t('Order Options')}</DialogTitle>
                        <DialogDescription className="sr-only">{t('Order Options')}</DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 overflow-hidden">
                        {loading && !order ? (
                            <div className="flex h-full items-center justify-center">
                                <LoaderCircle className="text-muted-foreground h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <Tabs className="flex h-full flex-col" defaultValue="details">
                                <TabsList>
                                    <TabsTrigger value="details">{t('Details')}</TabsTrigger>
                                    <TabsTrigger value="payments" disabled={!canAcceptPayments}>
                                        {t('Payments')}
                                    </TabsTrigger>
                                    <TabsTrigger value="instalments" disabled={isFinalized}>
                                        {t('Instalments')}
                                    </TabsTrigger>
                                    <TabsTrigger value="refund" disabled={isFinalized}>
                                        {t('Refund & Return')}
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="details" className="min-h-0 flex-1 overflow-y-auto">
                                    <OrderDetailsTab order={order} />
                                </TabsContent>
                                <TabsContent value="payments" className="min-h-0 flex-1 overflow-y-auto">
                                    <OrderPaymentsTab order={order} />
                                </TabsContent>
                                <TabsContent value="instalments" className="min-h-0 flex-1 overflow-y-auto">
                                    <OrderInstalmentsTab order={order} onSuccess={refetch} />
                                </TabsContent>
                                <TabsContent value="refund" className="min-h-0 flex-1 overflow-y-auto">
                                    <OrderRefundTab order={order} onSuccess={refetch} />
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>

                    <DialogFooter className="mt-auto">
                        <div className="mt-2 flex w-full flex-row items-center justify-between">
                            <div>
                                {!isFinalized && (
                                    <Button variant="destructive" onClick={() => setIsVoidDialogOpen(true)} disabled={isVoiding}>
                                        <XCircle className="me-2 h-4 w-4" />
                                        {t('Void')}
                                    </Button>
                                )}
                            </div>
                            <Button variant="default" onClick={handlePrint} disabled={!order || isPrinting}>
                                {isPrinting ? (
                                    <LoaderCircle className="me-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Printer className="me-2 h-4 w-4" />
                                )}
                                {t('Print')}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isVoidDialogOpen}
                onOpenChange={(nextOpen) => {
                    setIsVoidDialogOpen(nextOpen);
                    if (!nextOpen) setVoidReason('');
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Void The Order')}</DialogTitle>
                        <DialogDescription className="sr-only">{t('Void The Order')}</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                        <div className="text-sm">
                            {t(
                                'The current order will be voided. This will cancel the transaction. Further details about the operation will be tracked on the report.',
                            )}
                        </div>
                        <Textarea
                            value={voidReason}
                            onChange={(e) => setVoidReason(e.target.value)}
                            placeholder={t('Reason for voiding this order (optional)')}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsVoidDialogOpen(false)} variant="outline" className="flex-1">
                            {t('Cancel')}
                        </Button>
                        <Button onClick={handleVoidOrder} variant="default" className="flex-1" disabled={isVoiding}>
                            {isVoiding ? <LoaderCircle className="h-4 w-4 animate-spin" /> : t('Confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
