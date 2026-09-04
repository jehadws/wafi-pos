import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NumericKeypadDialog } from '@/components/ui/numeric-keypad-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ordersApi } from '@/api';
import axios from 'axios';
import { formatCurrency } from '@/utils/format';
import { useForm } from '@inertiajs/react';
import { Delete, LoaderCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import ProductConditionDialog from './product-condition-dialog';
import RefundProductItem from './refund-product-item';

type Payment = {
    identifier: string;
    label: string;
};

type Condition = {
    value: string;
    label: string;
};

export const productConditions: Condition[] = [
    { value: 'damaged', label: 'Damaged' },
    { value: 'unspoiled', label: 'Unspoiled' },
];

type Props = {
    order: Order | null;
    onSuccess?: () => void;
};

export default function OrderRefundTab({ order, onSuccess }: Props) {
    const { t } = useTranslation();
    const [rawValue, setRawValue] = useState(0);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
    const [editingQtyProduct, setEditingQtyProduct] = useState<Product | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isEditingProduct, setIsEditingProduct] = useState(false);
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [conditionError, setConditionError] = useState<string>();

    const form = useForm({
        payment: { identifier: '' },
        total: '',
        products: [] as Product[],
    });

    const screenValue = (rawValue / 100).toFixed(2);

    const handleNumberClick = (digit: string) => {
        if (!/^\d$/.test(digit)) return;
        const newRaw = rawValue * 10 + parseInt(digit, 10);
        if (newRaw > 99999999) return;
        setRawValue(newRaw);
    };

    const handleBackspace = () => {
        setRawValue(Math.floor(rawValue / 10));
    };

    const handleConfirm = () => {
        if (screenValue === '0.00') return;
        if (!form.data.payment?.identifier) return toast.warning(t('Please select a payment gateway before proceeding.'));
        handleSubmitRefund(screenValue);
    };

    const handleSelectChange = (id: string) => {
        const product = order?.products?.find((product) => product.id.toString() === id);
        if (product) {
            setSelectedProduct({ ...product, condition: undefined, description: '' });
            setIsEditingProduct(false);
            setConditionError(undefined);
        }
    };

    const handleConfirmProduct = () => {
        if (!selectedProduct) return;

        if (!selectedProduct.condition) return setConditionError(t('This field is required.'));
        setConditionError(undefined);

        const existingProduct = form.data.products.find((p) => p.id === selectedProduct.id);

        if (existingProduct && isEditingProduct) {
            form.setData(
                'products',
                form.data.products.map((p) =>
                    p.id === selectedProduct.id
                        ? {
                              ...p,
                              condition: selectedProduct.condition,
                              description: selectedProduct.description,
                              unit_price: selectedProduct.unit_price,
                          }
                        : p,
                ),
            );
        } else if (existingProduct) {
            const originalQuantity = order?.products?.find((p) => p.id === selectedProduct.id)?.quantity || 0;
            if ((existingProduct.quantity || 0) + 1 > originalQuantity) {
                return toast.warning(t('The specified quantity exceeds the available quantity.'));
            }
            form.setData(
                'products',
                form.data.products.map((p) => (p.id === existingProduct.id ? { ...p, quantity: (p.quantity || 0) + 1 } : p)),
            );
        } else {
            form.setData('products', [{ ...selectedProduct, quantity: 1 }, ...form.data.products]);
        }

        setIsProductDialogOpen(false);
        setSelectedProduct(null);
        setIsEditingProduct(false);
    };

    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsEditingProduct(true);
        setIsProductDialogOpen(true);
    };

    const handleRemoveProduct = (product: Product) => {
        form.setData('products', form.data.products.filter((p) => p.id !== product.id));
    };

    const handleSubmitRefund = async (total: string) => {
        if (isSubmitting || !order?.id) return;
        setIsSubmitting(true);
        try {
            await ordersApi.refund(order.id, { ...form.data, total });
            toast.success(t('The order has been successfully refunded.'));
            form.reset();
            setSelectedProduct(null);
            setIsEditingProduct(false);
            setRawValue(0);
            onSuccess?.();
        } catch (error) {
            const description = axios.isAxiosError(error)
                ? error.response?.data?.message || error.message
                : error instanceof Error
                  ? error.message
                  : undefined;
            toast.error(t('Unable to proceed'), { description });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaymentGatewayClick = async () => {
        if (!order?.id) return;
        setIsPaymentDialogOpen(true);
        setPaymentSearchQuery('');
        setLoadingPayments(true);
        try {
            const payments = await ordersApi.getPayments();
            setPayments(payments[0]?.options || []);
        } catch {
            setPayments([]);
        } finally {
            setLoadingPayments(false);
        }
    };

    const handlePaymentSelect = (identifier: string) => {
        form.setData('payment', { identifier });
        setIsPaymentDialogOpen(false);
    };

    const handleQuantityClick = (product: Product) => {
        setEditingQtyProduct(product);
    };

    const handleQuantityConfirm = (value: string) => {
        if (!editingQtyProduct) return;
        const newQty = parseInt(value, 10);
        if (isNaN(newQty) || newQty <= 0) return;

        const originalProduct = order?.products?.find((p) => p.id === editingQtyProduct.id);
        if (originalProduct?.quantity != null && newQty > originalProduct.quantity) {
            return toast.warning(t('The specified quantity exceeds the available quantity.'));
        }

        form.setData(
            'products',
            form.data.products.map((p) => (p.id === editingQtyProduct.id ? { ...p, quantity: newQty } : p)),
        );
        setEditingQtyProduct(null);
    };

    const handleQuantityCancel = () => {
        setEditingQtyProduct(null);
    };

    const filteredPayments = payments.filter(
        (p) => !paymentSearchQuery || t(p.identifier).toLowerCase().includes(paymentSearchQuery.toLowerCase()),
    );

    const numbers = [
        ['7', '8', '9'],
        ['4', '5', '6'],
        ['1', '2', '3'],
    ];

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div>{t('Refund With Products')}</div>
                        <Separator />

                        <div className="flex flex-row items-center gap-2" dir="ltr">
                            <Select
                                value={selectedProduct ? selectedProduct.id?.toString() : undefined}
                                onValueChange={handleSelectChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('Choose an option')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {order?.products?.map((product: Product, i) => (
                                        <SelectItem key={product.id.toString() + i} value={product.id.toString()} disabled={product?.quantity === 0}>
                                            {product.name} (x{product?.quantity})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={() => {
                                    setIsEditingProduct(false);
                                    setIsProductDialogOpen(true);
                                }}
                                disabled={!selectedProduct}
                            >
                                {t('Add')}
                            </Button>
                        </div>

                        <div className="mt-4">{t('Products')}</div>
                        <Separator />

                        <div className="overflow-y-auto">
                            {form.data.products?.map((product: Product, i: number) => (
                                <RefundProductItem
                                    key={product.id?.toString() + i}
                                    product={product}
                                    conditions={productConditions}
                                    onQuantityClick={() => handleQuantityClick(product)}
                                    onEdit={() => handleEditProduct(product)}
                                    onDelete={() => handleRemoveProduct(product)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div>{t('Summary')}</div>
                        <Separator />

                        <div className="space-y-3">
                            <div className="bg-muted border-muted flex items-center justify-between rounded border p-3">
                                <span className="font-medium">{t('Total')}</span>
                                <span className="font-semibold">
                                    {formatCurrency(
                                        form.data.products?.reduce((sum: number, p: Product) => sum + Number(p.unit_price || 0) * (p.quantity || 0), 0) ||
                                            0,
                                    )}
                                </span>
                            </div>
                            <div className="bg-success/30 border-success/60 flex items-center justify-between rounded border p-3">
                                <span className="font-medium">{t('Paid')}</span>
                                <span className="font-semibold">{formatCurrency(order?.tendered || 0)}</span>
                            </div>
                            <div
                                className="bg-error/30 border-error flex cursor-pointer items-center justify-between rounded border p-3"
                                onClick={handlePaymentGatewayClick}
                            >
                                <span className="font-medium">{t('Payment Gateway')}</span>
                                <span className="font-semibold">
                                    {form.data.payment?.identifier
                                        ? payments.find((payment) => payment.identifier === form.data.payment.identifier)?.label
                                        : t('Select')}
                                </span>
                            </div>
                            <div className="bg-muted border-muted flex items-center justify-between rounded border p-3">
                                <span className="font-medium">{t('Screen')}</span>
                                <span className="font-semibold">{formatCurrency(parseFloat(screenValue))}</span>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-3 gap-2">
                            {numbers.map((row) =>
                                row.map((num) => (
                                    <Button
                                        key={num}
                                        variant="outline"
                                        size="lg"
                                        className="text-foreground h-14 bg-transparent text-xl font-semibold"
                                        onClick={() => handleNumberClick(num)}
                                    >
                                        {num}
                                    </Button>
                                )),
                            )}

                            <Button
                                variant="outline"
                                size="lg"
                                className="text-foreground h-14 bg-transparent text-xl font-semibold"
                                onClick={handleBackspace}
                            >
                                <Delete className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="text-foreground h-14 bg-transparent text-xl font-semibold"
                                onClick={() => handleNumberClick('0')}
                            >
                                0
                            </Button>
                            <Button
                                size="lg"
                                className="h-14 bg-green-600 text-lg font-semibold text-white hover:bg-green-700"
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : t('Enter')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Payment Gateway')}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                className="ps-10"
                                placeholder={t('Search...')}
                                value={paymentSearchQuery}
                                onChange={(e) => setPaymentSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
                            {loadingPayments ? (
                                <div className="flex items-center justify-center py-8">
                                    <LoaderCircle className="h-6 w-6 animate-spin" />
                                </div>
                            ) : filteredPayments.length === 0 ? (
                                <div className="py-4 text-center text-sm">
                                    {payments.length === 0 ? t('No payments available.') : t('No results found.')}
                                </div>
                            ) : (
                                filteredPayments.map((payment: Payment) => (
                                    <Button
                                        key={payment.identifier}
                                        variant="outline"
                                        className="justify-start"
                                        onClick={() => handlePaymentSelect(payment.identifier)}
                                    >
                                        {t(payment.label)}
                                    </Button>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <NumericKeypadDialog
                open={!!editingQtyProduct}
                onOpenChange={(open) => {
                    if (!open) setEditingQtyProduct(null);
                }}
                title={`${t('Define Quantity')}  (${editingQtyProduct?.quantity} ${t('Available')})`}
                onConfirm={handleQuantityConfirm}
                onCancel={handleQuantityCancel}
                maxLength={6}
            />

            <ProductConditionDialog
                open={isProductDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsProductDialogOpen(false);
                        setSelectedProduct(null);
                        setIsEditingProduct(false);
                        setConditionError(undefined);
                    }
                }}
                selectedProduct={selectedProduct}
                onProductChange={setSelectedProduct}
                onConfirm={handleConfirmProduct}
                conditionError={conditionError}
                conditions={productConditions}
            />
        </>
    );
}
