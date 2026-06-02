import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { LoaderCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useOrder } from '../../../hooks/use-order';
import { useTranslation } from '../../../lib/i18n';
import OrderDetailsTab from './order-details-tab';
import OrderPaymentsTab from './order-payments-tab';
import OrderRefundTab from './order-refund-tab';
import ProductConditionDialog from './product-condition-dialog';

type Props = {
    options: { isOpen: boolean; id: number | null };
    setOptions: (value: { isOpen: boolean; id: number | null }) => void;
};

const conditions = [
    { value: '0', label: 'Choose an option' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'unspoiled', label: 'Unspoiled' },
];

export default function OrderOptionsDialog({ options, setOptions }: Props) {
    const { t } = useTranslation();
    const { order, loading, refetch, clear } = useOrder(options.id);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>();
    const [isProductDailogOpen, setIsProductDialogOpen] = useState(false);
    const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVoiding, setIsVoiding] = useState(false);

    const form = useForm({
        payment: { identifier: '' },
        refund_shipping: false,
        total: '',
        products: [],
    });

    const handleSelectChange = (id: string) => {
        if (id === '0') return setSelectedProduct(null);
        const product = order?.products?.find((product) => product.id.toString() === id);
        if (product) {
            setSelectedProduct({ ...product, condition: '0', description: '' });
        }
    };

    const handleAddProductClick = (product: Product | null | undefined) => {
        if (!product) return;
        setIsProductDialogOpen(true);
    };

    const handleComfirmProduct = () => {
        if (!selectedProduct?.condition || selectedProduct?.condition === '0')
            return form.setError(`product.condition-${selectedProduct.id}`, t('This field is required.'));

        const originalProduct = order?.products?.find((p) => p.id === selectedProduct.id);
        const originalQuantity = originalProduct?.quantity || 0;
        const existingIndex = form.data.products.findIndex((p) => p.id === selectedProduct.id);

        if (existingIndex !== -1) {
            const existingProduct = form.data.products[existingIndex];
            const currentQuantity = existingProduct.quantity || 0;

            if (currentQuantity + 1 > originalQuantity) {
                return toast.warning(t('The specified quantity exceed the available quantity.'));
            }

            const updatedProducts = [...form.data.products];
            updatedProducts[existingIndex] = { ...existingProduct, quantity: currentQuantity + 1 };
            form.setData({ ...form.data, products: updatedProducts });
        } else {
            form.setData({ ...form.data, products: [selectedProduct, ...form.data.products] });
        }

        setIsProductDialogOpen(false);
    };

    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsProductDialogOpen(true);
    };

    const handleRemoveProduct = (product: Product) => {
        form.setData({ ...form.data, products: form.data.products.filter((p) => p.id !== product.id) });
    };

    const handleSubmitRefund = async (total: string) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await axios.post(`/api/orders/${options.id}/refund`, { ...form.data, total });
            toast.success(t('The order has been successfully refunded.'));
            form.reset();
            refetch();
        } catch (error: any) {
            toast.error(t('Unable to proceed'), { description: error?.response?.data?.message || error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDialogChange = (open: boolean) => {
        if (open) {
            setOptions({ ...options, isOpen: true });
        } else {
            form.reset();
            clear();
            setOptions({ isOpen: false, id: null });
        }
    };

    const handleVoidOrder = async () => {
        if (isVoiding) return;
        setIsVoiding(true);
        try {
            await axios.post(`/api/orders/${options.id}/void`, { reason: '' });
            toast.success(t('The order has been voided.'));
            refetch();
            setIsVoidDialogOpen(false);
        } catch (error: any) {
            toast.error(t('Something went wrong. Please try again'));
        } finally {
            setIsVoiding(false);
        }
    };

    return (
        <>
            <Dialog open={options.isOpen} onOpenChange={handleDialogChange}>
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
                            <Tabs className="flex h-full flex-col" defaultValue="details" onValueChange={() => refetch()}>
                                <TabsList>
                                    <TabsTrigger value="details">{t('Details')}</TabsTrigger>
                                    <TabsTrigger
                                        value="payments"
                                        disabled={
                                            order?.payment_status === 'partially_refunded' ||
                                            order?.payment_status === 'refunded' ||
                                            order?.payment_status === 'order_void'
                                        }
                                    >
                                        {t('Payments')}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="refund"
                                        disabled={order?.payment_status === 'refunded' || order?.payment_status === 'order_void'}
                                    >
                                        {t('Refund & Return')}
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="details" className="min-h-0 flex-1 overflow-y-auto">
                                    <OrderDetailsTab order={order} />
                                </TabsContent>
                                <TabsContent value="payments" className="min-h-0 flex-1 overflow-y-auto">
                                    <OrderPaymentsTab order={order} />
                                </TabsContent>
                                <TabsContent value="refund" className="min-h-0 flex-1 overflow-y-auto">
                                    <OrderRefundTab
                                        order={order}
                                        form={form}
                                        conditions={conditions}
                                        selectedProduct={selectedProduct}
                                        isSubmitting={isSubmitting}
                                        onSelectChange={handleSelectChange}
                                        onAddProductClick={handleAddProductClick}
                                        onEditProduct={handleEditProduct}
                                        onRemoveProduct={handleRemoveProduct}
                                        onSubmitRefund={handleSubmitRefund}
                                    />
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>

                    <DialogFooter className="mt-auto">
                        <div className="mt-2 flex w-full flex-row items-center justify-between">
                            <div>
                                {order?.payment_status !== 'refunded' && order?.payment_status !== 'order_void' && (
                                    <Button variant="destructive" onClick={() => setIsVoidDialogOpen(true)} disabled={isVoiding}>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        {t('Void')}
                                    </Button>
                                )}
                            </div>
                            <Button variant="default">{t('Print')}</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ProductConditionDialog
                open={isProductDailogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsProductDialogOpen(false);
                        setSelectedProduct(null);
                    }
                }}
                selectedProduct={selectedProduct}
                onProductChange={(product) => setSelectedProduct(product)}
                onConfirm={handleComfirmProduct}
                errors={form.errors}
                conditions={conditions}
            />

            <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Void The Order')}</DialogTitle>
                        <DialogDescription className="sr-only">{t('Void The Order')}</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                        <div className="text-sm">
                            {t(
                                'The current order will be void. This will cancel the transaction. Further details about the operation will be tracked on the report.',
                            )}
                        </div>
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
