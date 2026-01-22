import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { InvoiceTemplate } from '@/utils/print';
import { InertiaFormProps } from '@inertiajs/react';
import axios from 'axios';
import { Eye, Loader2, Printer, Unlock } from 'lucide-react';
import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import OrderProductCard from './order-product-card';

type Props = {
    order: TOrder;
    form: InertiaFormProps<OrderFormValuesType>;
    onOpenChange: (open: boolean) => void;
};

type POSResponse = {
    id: number;
    description: null | string;
    code: string;
    title: string;
    type: 'takeaway' | 'delivery';
    payment_status: 'hold' | 'paid' | 'not-available' | 'unpaid';
    process_status: 'not-available';
    delivery_status: 'not-available';
    discount: number;
    discount_type: 'flat' | 'percentage';
    support_instalments: boolean;
    discount_percentage: number;
    shipping: number;
    shipping_rate: number;
    shipping_type: null | 'flat' | 'percentage';
    total_without_tax: number;
    subtotal: number;
    total_with_tax: number;
    total_coupons: number;
    total_cogs: number;
    total: number;
    tax_value: number;
    products_tax_value: number;
    tax_group_id: null | number;
    tax_type: '0';
    tendered: number;
    change: number;
    final_payment_date: null | string;
    total_instalments: number;
    customer_id: number;
    note: null | string;
    note_visibility: 'hidden' | 'visible';
    author: number;
    uuid: null | string;
    register_id: null | number;
    voidance_reason: null | string;
    created_at: string;
    updated_at: string;
    payments: TPaymentMethod[];
    shipping_address: Address;
    billing_address: Address;
    taxes: Tax[];
    instalments: [];
    coupons: Coupon[];
    products: {
        id: number;
        name: string;
        unit_name: string;
        mode: 'normal';
        product_type: 'materialized' | 'dematerialized' | 'grouped';
        product_id: number;
        order_id: number;
        unit_id: number;
        unit_quantity_id: number;
        product_category_id: number;
        procurement_product_id: null | number;
        tax_group_id: number;
        tax_type: 'exclusive' | 'inclusive';
        uuid: null | string;
        status: 'sold';
        return_observations: null;
        return_condition: null;
        discount_type: 'percentage' | 'flat';
        discount: number;
        quantity: number;
        discount_percentage: number;
        unit_price: number;
        price_with_tax: number;
        price_without_tax: number;
        wholesale_tax_value: number;
        sale_tax_value: number;
        tax_value: number;
        rate: number;
        total_price: number;
        total_price_with_tax: number;
        total_price_without_tax: number;
        total_purchase_price: number;
        created_at: string;
        updated_at: string;
        product: Product & {
            tax_group: TaxGroup & {
                taxes: Tax[];
            };
            unit_quantities: UnitQuantity[];
        };
        unit: Unit;
    }[];
    customer: Customer & {
        billing: Address;
        shipping: Address;
    };
};

export default function OrderCard({ order, form, onOpenChange }: Props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [orderProducts, setOrderProducts] = useState<TOrderProducts[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const getOrderProducts = async (orderId: number) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/orders/${orderId}/products`);
            setOrderProducts(res.data);
        } catch (error) {
            console.error('Error fetching Order Products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: contentRef,
        documentTitle: `Invoice-${order.code}`,
    });

    const handlePrepareBeforePrint = async () => {
        const res = await axios.get(`/api/orders/${order.id}/products`);
        const html = InvoiceTemplate(order, res.data);
        console.log('orderProducts', orderProducts);

        const container = contentRef.current;
        if (!container) return;

        container.innerHTML = html;
        handlePrint();

        // Restore original content
        container.innerHTML = '';
    };

    const handleOpenOrder = async () => {
        try {
            onOpenChange(false);
            const { data } = await axios.get<POSResponse>(`/api/orders/${order.id}/pos`);
            const { data: group } = await axios.get<TaxGroup>(`/api/customers/${data.customer_id}/group`);
            console.log(data);
            form.setData({
                ...form.data,
                id: data.id,
                code: data.code,
                discount_type: data.discount_type,
                title: data.title,
                discount: data.discount,
                discount_percentage: data.discount_percentage,
                subtotal: data.subtotal,
                total: data.total,
                coupons: data.coupons,
                total_coupons: data.total_coupons,
                tendered: data.tendered,
                note: data.note,
                note_visibility: data.note_visibility,
                tax_group_id: data.tax_group_id,
                tax_type: data.tax_type,
                taxes: data.taxes,
                tax_group: group,
                payment_status: data.payment_status,
                customer_id: data.customer_id,
                change: data.change,
                addresses: {
                    billing: data.billing_address,
                    shipping: data.shipping_address,
                },
                shipping_type: data.shipping_type,
                total_products: 0,
                shipping: data.shipping,
                tax_value: data.tax_value,
                products_tax_value: data.products_tax_value,
                shipping_rate: data.shipping_rate,
                type:
                    data.type === 'takeaway'
                        ? { identifier: 'takeaway', label: 'Take Away', icon: '/images/groceries.png', selected: true }
                        : { identifier: 'delivery', label: 'Delivery', icon: '/images/delivery.png' },
                products: data.products.map((product) => ({
                    order_id: product.order_id,
                    product_id: product.product_id,
                    name: product.name,
                    discount_type: product.discount_type,
                    discount: product.discount,
                    discount_percentage: product.discount_percentage,
                    product_type: product.product_type,
                    rate: product.rate,
                    quantity: product.quantity,
                    tax_group_id: product.tax_group_id,
                    tax_type: product.tax_type,
                    tax_value: product.tax_value / product.quantity,
                    unit_id: product.unit_id,
                    unit_price: product.unit_price,
                    price_with_tax: product.price_with_tax,
                    price_without_tax: product.price_without_tax,
                    unit_name: product.unit.name,
                    total_price: product.total_price,
                    total_price_without_tax: product.total_price_without_tax,
                    total_price_with_tax: product.total_price_with_tax,
                    mode: product.mode,
                    unit_quantity_id: product.unit_quantity_id,
                    total_tax_value: product.tax_value,
                    _uuid: `${product.id}-${product.unit.id}-${Date.now()}`,
                })),
                instalments: data.instalments,
                payments: data.payments,
                customer: data.customer,
            });
        } catch (error) {
            console.error('Error fetching Order Products:', error);
        }
    };

    return (
        <>
            <div ref={contentRef} />
            <div className="flex flex-col gap-2 border-b py-3">
                <div className="text-lg font-bold">{order.title}</div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <div>
                            <strong>{t('Order Code')}:</strong> {order.code}
                        </div>
                        <div>
                            <strong>{t('Cashier')}:</strong> {order.user_username}
                        </div>
                        <div>
                            <strong>{t('Total')}:</strong> {formatCurrency(order.total)}
                        </div>
                        <div>
                            <strong>{t('Tendered')}:</strong> {formatCurrency(order.tendered)}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div>
                            <strong>{t('Customer')}:</strong> {order.customer_first_name} {order.customer_last_name}
                        </div>
                        <div>
                            <strong>{t('Date')}:</strong> {order.created_at}
                        </div>
                        <div>
                            <strong>{t('Type')}:</strong> {order.type}
                        </div>
                    </div>
                </div>
                <div className="flex flex-row justify-end gap-2">
                    <Button onClick={handleOpenOrder}>
                        <Unlock className="h-3 w-3" />
                        {t('Open')}
                    </Button>
                    <Button
                        variant={'secondary'}
                        onClick={() => {
                            setIsOpen(true);
                            getOrderProducts(order.id);
                        }}
                    >
                        <Eye className="h-3 w-3" />
                        {t('Products')}
                    </Button>
                    <Button variant={'destructive'} onClick={handlePrepareBeforePrint}>
                        <Printer className="h-3 w-3" />
                        {t('Print')}
                    </Button>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className={cn('flex h-[90vh] max-h-[90vh] w-[50vw] max-w-[50vw] flex-col sm:max-w-[50vw]')}>
                    <DialogTitle>
                        {t('Products')} - {order.code}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {t('Products')} - {order.code}
                    </DialogDescription>
                    {!loading && (
                        <div className="min-h-[150px] flex-1">
                            <div className="flex h-full flex-col gap-3">
                                {orderProducts.map((orderProduct) => (
                                    <OrderProductCard key={orderProduct.id} orderProduct={orderProduct} />
                                ))}
                            </div>
                        </div>
                    )}
                    {loading && (
                        <div className="flex min-h-[150px] flex-1 items-center justify-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
