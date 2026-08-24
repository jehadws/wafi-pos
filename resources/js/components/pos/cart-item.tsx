import type React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNumericKeypad } from '@/hooks/use-numeric-keypad';
import { usePOS } from '@/hooks/usePOS';
import { isPosOptionEnabled, POS_OPTION_KEYS } from '@/constants/pos-options';
import { OrderProduct } from '@/types/models/order-product';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/utils/format';
import { Award, Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { NumericKeypadDialog } from '@/components/ui/numeric-keypad-dialog';

interface CartItemProps {
  item: OrderProduct;
  removeFromCart: (product: OrderProduct) => void;
  updateQuantity: (product: OrderProduct, quantity: number) => void;
  updatePrice: (product: OrderProduct, price: number) => void;
  updateDiscountPercentage: (product: OrderProduct, price: number) => void;
  showQuantity?: boolean;
}

const CART_ITEM_LINK_CLASSES = "text-muted-foreground hover:text-primary hover:decoration-primary active:bg-muted active:scale-95 rounded px-1 py-0.5 text-left underline decoration-dotted decoration-1 underline-offset-3";

export default function CartItem({ item, updateDiscountPercentage, updatePrice, removeFromCart, updateQuantity, showQuantity = true }: CartItemProps) {
  const { t } = useTranslation();
  const { options } = usePOS();
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

  const handleToggleWholesale = () => {
    const quantities = item.quantities ?? null;

    if (item.mode === 'wholesale') {
      // Switch back to normal — use $quantities if available, else keep current price
      const salePrice = quantities
        ? quantities.sale_price_without_tax || quantities.sale_price || item.unit_price
        : item.unit_price;
      updatePrice(item, salePrice);
      // Update mode via the store directly so Zustand triggers a re-render
      usePOS.getState().updateProduct(item, { mode: 'normal' });
      toast.info(t('Switched to retail price'));
    } else {
      // Switch to wholesale — use $quantities if available
      const wholesalePrice = quantities
        ? quantities.wholesale_price_without_tax || quantities.wholesale_price || 0
        : 0;
      if (wholesalePrice <= 0) {
        toast.warning(t('No wholesale price defined for this product'));
        return;
      }
      updatePrice(item, wholesalePrice);
      usePOS.getState().updateProduct(item, { mode: 'wholesale' });
      toast.info(t('Switched to wholesale price'));
    }
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
    <div className={`hover:bg-muted/30 grid h-14 items-center text-sm transition-colors ${showQuantity ? 'grid-cols-14' : 'grid-cols-12'}`}>
      <div className="col-span-10 flex h-10 flex-row items-center justify-start px-2 py-2">
        <div className="flex flex-col">
          <p className="text-[18px] font-medium">
            {item.name} -- {item.unit_name}
            {item.mode === 'wholesale' && (
              <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {t('Wholesale')}
              </span>
            )}
          </p>
          <div className="flex flex-row gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                priceKeypad.openKeypad();
              }}
              className={CART_ITEM_LINK_CLASSES}
            >
              {t('Price')}: {formatCurrency(item.price_without_tax)}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                discountKeypad.openKeypad();
              }}
              className={CART_ITEM_LINK_CLASSES}
            >
              {t('Discount')} {item.discount_percentage || 0}%: {formatCurrency(item.discount || 0)}
            </button>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 active:scale-95 h-11 w-11"
            onClick={(e) => {
              e.stopPropagation();
              removeFromCart(item);
            }}
            aria-label={t('Remove from cart', { name: item.name || '' })}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
          {isPosOptionEnabled(options, POS_OPTION_KEYS.allowWholesalePrice) && (
            <Button
              variant="ghost"
              size="icon"
              className={`active:scale-95 h-11 w-11 ${item.mode === 'wholesale' ? 'bg-green-500/20 text-green-600' : 'hover:bg-green-500/10 hover:text-green-500/80'}`}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleWholesale();
              }}
              title={item.mode === 'wholesale' ? t('Switch to retail price') : t('Switch to wholesale price')}
              aria-label={t('Toggle wholesale price')}
            >
              <Award className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      {showQuantity && (
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
                className="active:scale-95 h-10 w-10 rounded-full"
                onClick={handleDecrement}
                aria-label={t('Decrease quantity')}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span
                className="mx-1 min-w-[28px] cursor-pointer rounded px-1 py-1 text-center active:bg-muted"
                onClick={() => setIsEditing(true)}
                title={t('Click to edit quantity')}
              >
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="active:scale-95 h-10 w-10 rounded-full"
                onClick={handleIncrement}
                aria-label={t('Increase quantity')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="col-span-2 flex h-14 items-center justify-center border-l text-center">${(item.total_price_without_tax ?? 0).toFixed(2)}</div>
      <NumericKeypadDialog {...discountKeypad.keypadProps} />
      <NumericKeypadDialog {...priceKeypad.keypadProps} />
    </div>
  );
}
