import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';
import { Head, usePage } from '@inertiajs/react';
import { Printer } from 'lucide-react';

export default function OrderInvoicePage() {
    const { t } = useTranslation();
    const { order, options, billing, shipping, title } = usePage<{
        order: Order;
        options: OrderType;
        billing: Address;
        shipping: Address;
        title: string;
    }>().props;

    console.log('order', order);
    console.log('options', options);
    console.log('billing', billing);
    console.log('shipping', shipping);
    console.log('title', title);

    return (
        <AppLayout breadcrumbs={[]}>
            <Head title={title} />
            <div className="min-h-screen p-6">
                <div className="mx-auto max-w-7xl rounded-lg border shadow-sm">
                    <div className="bg-muted rounded-t-lg px-6 py-4">
                        <h1 className="text-2xl font-semibold" dangerouslySetInnerHTML={{ __html: title }}></h1>
                        <p className="text-muted-foreground mt-1 text-sm">{t('No description')}</p>
                    </div>

                    <div className="p-6">
                        <div className="mb-6">
                            <Button className="">
                                <Printer className="mr-2 h-4 w-4" />
                                {t('Print')}
                            </Button>
                        </div>

                        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                            <div>
                                <h2 className="text-muted-forground mb-4 text-lg font-semibold">{t('Store Details')}</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="">{t('Order Code')}</span>
                                        <span className="text-muted-forground">{order.code}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Cashier')}</span>
                                        <span className="text-muted-forground">{order.user.username}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Date')}</span>
                                        <span className="text-muted-forground">{order.created_at}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Customer')}</span>
                                        <span className="text-muted-forground">
                                            {order.customer.first_name} {order.customer.last_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Type')}</span>
                                        <span className="text-muted-forground">{order.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Payment Status')}</span>
                                        <span className="text-muted-forground">{order.paymentStatus}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-muted-forground mb-4 text-lg font-semibold">{t('Billing Details')}</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="">{t('First Name')}</span>
                                        <span className="text-gray-500">
                                            {order.billing_address.first_name ? order.billing_address.first_name : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Last Name')}</span>
                                        <span className="text-gray-500">
                                            {order.billing_address.last_name ? order.billing_address.last_name : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Phone')}</span>
                                        <span className="text-gray-500">{order.billing_address.phone ? order.billing_address.phone : t('N/A')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Address 1')}</span>
                                        <span className="text-gray-500">
                                            {order.billing_address.address_1 ? order.billing_address.address_1 : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Address 2')}</span>
                                        <span className="text-gray-500">
                                            {order.billing_address.address_2 ? order.billing_address.address_2 : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Country')}</span>
                                        <span className="text-gray-500">
                                            {order.billing_address.country ? order.billing_address.country : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('City')}</span>
                                        <span className="text-gray-500">{order.billing_address.city ? order.billing_address.city : t('N/A')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('PO.Box')}</span>
                                        <span className="text-gray-500">{order.billing_address.pobox ? order.billing_address.pobox : t('N/A')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Company')}</span>
                                        <span className="text-gray-500">
                                            {order.billing_address.company ? order.billing_address.company : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Email')}</span>
                                        <span className="text-gray-500">{order.billing_address.email ? order.billing_address.email : t('N/A')}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-muted-forground mb-4 text-lg font-semibold">{t('Shipping Details')}</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="">{t('First Name')}</span>
                                        <span className="text-gray-500">
                                            {order.shipping_address.first_name ? order.shipping_address.first_name : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Last Name')}</span>
                                        <span className="text-gray-500">
                                            {order.shipping_address.last_name ? order.shipping_address.last_name : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Phone')}</span>
                                        <span className="text-gray-500">
                                            {order.shipping_address.phone ? order.shipping_address.phone : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Address 1')}</span>
                                        <span className="text-gray-500">
                                            {order.shipping_address.address_1 ? order.shipping_address.address_1 : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Address 2')}</span>
                                        <span className="text-gray-500">
                                            {order.shipping_address.address_2 ? order.shipping_address.address_2 : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Country')}</span>
                                        <span className="text-gray-500">
                                            {order.shipping_address.country ? order.shipping_address.country : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('City')}</span>
                                        <span className="text-gray-500">{order.shipping_address.city ? order.shipping_address.city : t('N/A')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('PO.Box')}</span>
                                        <span className="text-gray-500">
                                            {order.shipping_address.pobox ? order.shipping_address.pobox : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Company')}</span>
                                        <span className="text-gray-500">
                                            {order.shipping_address.company ? order.shipping_address.company : t('N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">{t('Email')}</span>
                                        <span className="text-gray-500">
                                            {order.shipping_address.email ? order.shipping_address.email : t('N/A')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border">
                            <div className="bg-muted grid grid-cols-6 gap-4 p-4 font-semibold">
                                <div>{t('Product')}</div>
                                <div className="text-center">{t('Unit Price')}</div>
                                <div className="text-center">{t('Quantity')}</div>
                                <div className="text-center">{t('Discount')}</div>
                                <div className="text-center">{t('Tax')}</div>
                                <div className="text-center">{t('Total Price')}</div>
                            </div>
                            {order.products.map((product) => (
                                <div key={product.id} className="grid grid-cols-6 gap-4 border-b p-4">
                                    <div className="text-muted-forground">{product.name}</div>
                                    <div className="text-muted-forground text-center">{formatCurrency(product.unit_price)}</div>
                                    <div className="text-muted-forground text-center">{product.quantity}</div>
                                    <div className="text-muted-forground text-center">{formatCurrency(product.discount)}</div>
                                    <div className="text-muted-forground text-center">{formatCurrency(product.tax_value * product.quantity)}</div>
                                    <div className="text-muted-forground text-center">{formatCurrency(product.total_price)}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <div className="w-80 space-y-2">
                                <div className="flex justify-between py-2">
                                    <span className="font-semibold">{t('Sub Total')}</span>
                                    <span className="text-muted-forground">{formatCurrency(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="font-semibold">{t('Discount')}</span>
                                    <span className="text-muted-forground">{formatCurrency(-order.discount)}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 py-2">
                                    <span className="font-semibold">{t('Total')}</span>
                                    <span className="text-muted-forground">{formatCurrency(order.total)}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="font-semibold">{t('Paid')}</span>
                                    <span className="text-muted-forground">{formatCurrency(order.tendered)}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="font-semibold">{t('Change')}</span>
                                    <span className="text-muted-forground">{formatCurrency(order.change)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
