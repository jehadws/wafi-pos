import { useTranslation } from '@/lib/i18n';

interface TotalsSummaryProps {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    shipping: number;
    customer: Customer | null | undefined;
    orderType: OrderTypeObj | null | undefined;
    onOpenDiscountDialog: () => void;
    onOpenShippingDialog: () => void;
    onOpenOrderTypeDialog: () => void;
    onOpenSelectCustomerDialog: () => void;
}

export default function TotalsSummary({
    subtotal,
    orderType,
    tax,
    shipping,
    discount,
    total,
    customer,
    onOpenDiscountDialog,
    onOpenShippingDialog,
    onOpenOrderTypeDialog,
    onOpenSelectCustomerDialog,
}: TotalsSummaryProps) {
    const { t } = useTranslation();
    return (
        <div className="bg-card border-t">
            <div className="grid grid-cols-3 border-b text-sm">
                <div className="col-span-2 border-r p-2">{t('Product Taxes')}</div>
                <div className="col-span-1 p-2 text-right">${tax.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-3 border-b text-sm">
                <div
                    className="decoration-primary cursor-pointer border-r p-2 underline decoration-dashed underline-offset-4"
                    onClick={onOpenSelectCustomerDialog}
                >
                    {t('Customer')}: {customer ? `${customer.first_name} ${customer.last_name}` : t('N/A')}
                </div>
                <div className="border-r p-2">{t('Sub Total')}</div>
                <div className="p-2 text-right">${subtotal.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-3 border-b text-sm">
                <div
                    className="decoration-primary cursor-pointer border-r p-2 underline decoration-dashed underline-offset-4"
                    onClick={onOpenOrderTypeDialog}
                >
                    {t('Type')}: {orderType ? orderType.label : t('N/A')}
                </div>
                <div className="border-r p-2">{t('Discount')}</div>
                <div
                    className="decoration-primary cursor-pointer p-2 text-right underline decoration-dashed underline-offset-4"
                    onClick={onOpenDiscountDialog}
                >
                    ${discount.toFixed(2)}
                </div>
            </div>

            {orderType?.identifier === 'delivery' && (
                <div className="grid grid-cols-3 border-b text-sm">
                    <div></div>
                    <div
                        className="decoration-primary cursor-pointer border-r border-l p-2 underline decoration-dashed underline-offset-4"
                        onClick={onOpenShippingDialog}
                    >
                        {t('Shipping')}
                    </div>
                    <div className="p-2 text-right">${shipping.toFixed(2)}</div>
                </div>
            )}
            <div className="bg-muted/30 grid grid-cols-3 text-sm font-medium">
                <div></div>
                <div className="border-r border-l p-2">{t('Total')}</div>
                <div className="p-2 text-right">${total.toFixed(2)}</div>
            </div>
        </div>
    );
}
