import type React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNumericKeypad } from '@/hooks/use-numeric-keypad';
import { OrderProduct } from '@/interfaces/order-product';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';
import { usePage } from '@inertiajs/react';
import { Award, Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { NumericKeypadDialog } from '../ui/numeric-keypad-dialog';

interface CartItemProps {
    item: OrderProduct;
    removeFromCart: (product: OrderProduct) => void;
    updateQuantity: (product: OrderProduct, quantity: number) => void;
    updatePrice: (product: OrderProduct, price: number) => void;
    updateDiscountPercentage: (product: OrderProduct, price: number) => void;
}

export default function CartItem({ item, updateDiscountPercentage, updatePrice, removeFromCart, updateQuantity }: CartItemProps) {
    const { t } = useTranslation();
    const { options } = usePage<{ options: NsPosOptions }>().props;
    const [isEditing, setIsEditing] = useState(false);
    const [quantityInput, setQuantityInput] = useState(item.quantity.toString());

    const handleIncrement = () => {
        updateQuantity(item, item.quantity + 1);
    };

    const handleDecrement = () => {
        if (item.quantity > 1) {
            updateQuantity(item, item.quantity - 1);
        } else {
            removeFromCart(item);
        }
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers
        const value = e.target.value.replace(/[^0-9]/g, '');
        setQuantityInput(value);
    };

    const handleChangePrice = (price: string) => {
        updatePrice(item, Number.parseFloat(price));
    };

    const handleChangePercentage = (discount: string) => {
        updateDiscountPercentage(item, Number.parseFloat(discount));
    };

    const discountKeypad = useNumericKeypad({
        onConfirm: handleChangePercentage,
        initialValue: '',
        title: t('Product Discount'),
        maxLength: 6,
        allowDecimal: true,
    });

    const priceKeypad = useNumericKeypad({
        onConfirm: handleChangePrice,
        initialValue: '',
        title: t('Product Price'),
        maxLength: 6,
        allowDecimal: true,
    });

    const handleQuantityBlur = () => {
        const newQuantity = Number.parseInt(quantityInput);
        if (!isNaN(newQuantity) && newQuantity > 0) {
            updateQuantity(item, newQuantity);
        } else {
            // Reset to current quantity if invalid
            setQuantityInput(item.quantity.toString());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleQuantityBlur();
        } else if (e.key === 'Escape') {
            setQuantityInput(item.quantity.toString());
            setIsEditing(false);
        }
    };

    return (
        <div className="hover:bg-muted/30 grid h-14 grid-cols-14 items-center text-sm transition-colors">
            <div className="col-span-10 flex h-10 flex-row items-center justify-start px-2 py-2">
                <div className="flex flex-col">
                    <p className="text-[18px] font-medium">
                        {item.name} -- {item.unit_name}
                    </p>
                    <div className="flex flex-row gap-4">
                        <p
                            onClick={() => priceKeypad.openKeypad()}
                            className="text-muted-foreground hover:text-primary hover:decoration-primary underline decoration-dotted decoration-1 underline-offset-3"
                        >
                            {t('Price')}: {formatCurrency(item.price_without_tax)}
                        </p>
                        <p
                            onClick={() => discountKeypad.openKeypad()}
                            className="text-muted-foreground hover:text-primary hover:decoration-primary underline decoration-dotted decoration-1 underline-offset-3"
                        >
                            {t('Discount')} {item.discount_percentage || 0}%: {formatCurrency(item.discount || 0)}
                        </p>
                    </div>
                </div>
                <div className="ml-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item);
                        }}
                        aria-label={t('Remove from cart', { name: item.name || '' })}
                    >
                        <Trash2 className="h-6 w-6" />
                    </Button>
                    {options.ns_jgrem_allow_wholesale_price && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-green-500/10 hover:text-green-500/80"
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            aria-label={t('Remove from cart', { name: item.name || '' })}
                        >
                            <Award className="h-6 w-6" />
                        </Button>
                    )}
                </div>
            </div>
            <div className="col-span-2 flex h-14 items-center justify-center space-x-1 border-l">
                {isEditing ? (
                    <Input
                        type="text"
                        value={quantityInput}
                        onChange={handleQuantityChange}
                        onBlur={handleQuantityBlur}
                        onKeyDown={handleKeyDown}
                        className="h-7 w-12 p-1 text-center"
                        autoFocus
                    />
                ) : (
                    <div className="flex items-center">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={handleDecrement}
                            aria-label={t('Decrease quantity')}
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span
                            className="mx-2 min-w-[20px] cursor-pointer text-center"
                            onClick={() => setIsEditing(true)}
                            title={t('Click to edit quantity')}
                        >
                            {item.quantity}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={handleIncrement}
                            aria-label={t('Increase quantity')}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>
            <div className="col-span-2 flex h-14 items-center justify-center border-l text-center">${item.total_price_without_tax.toFixed(2)}</div>
            <NumericKeypadDialog {...discountKeypad.keypadProps} />
            <NumericKeypadDialog {...priceKeypad.keypadProps} />
        </div>
    );
}
