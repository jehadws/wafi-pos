import type React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNumericKeypad } from '@/hooks/use-numeric-keypad';
import { usePOS } from '@/hooks/usePOS';
import { isPosOptionEnabled, isPriceWithTax, POS_OPTION_KEYS } from '@/constants/pos-options';
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
  onOpenPriceKeypad?: (item: OrderProduct) => void;
  onOpenDiscountKeypad?: (item: OrderProduct) => void;
  onOpenQuantityKeypad?: (item: OrderProduct) => void;
}

const CART_ITEM_LINK_CLASSES = "text-muted-foreground hover:text-primary hover:decoration-primary active:bg-muted active:scale-95 rounded px-1 py-0.5 text-start rtl:text-end underline decoration-dotted decoration-1 underline-offset-3 text-xs";

export default function CartItem({
  item,
  updateDiscountPercentage,
  updatePrice,
  removeFromCart,
  updateQuantity,
  showQuantity = true,
  onOpenPriceKeypad,
  onOpenDiscountKeypad,
  onOpenQuantityKeypad,
}: CartItemProps) {
  const { t } = useTranslation();
  const { options } = usePOS();
  const [isEditing, setIsEditing] = useState(false);
  const [quantityInput, setQuantityInput] = useState(item.quantity.toString());

  const isTaxIncluded = isPriceWithTax(options);
  const itemTotal = isTaxIncluded
    ? (item.total_price_with_tax ?? item.total_price ?? 0)
    : (item.total_price_without_tax ?? item.unit_price * item.quantity);

  const displayedPrice = isTaxIncluded
    ? (item.price_with_tax ?? item.unit_price)
    : (item.price_without_tax ?? item.unit_price);

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
      // Switch back to normal — use quantities snapshot if available, else keep current price
      const salePrice = quantities
        ? quantities.sale_price_without_tax || quantities.sale_price || item.unit_price
        : item.unit_price;
      updatePrice(item, salePrice);
      // Update mode via the store directly so Zustand triggers a re-render
      usePOS.getState().updateProduct(item, { mode: 'normal' });
      toast.info(t('Switched to retail price'));
    } else {
      // Switch to wholesale — use quantities snapshot if available
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

  // Fallback local keypads if parent did not provide centralized handlers
  const fallbackDiscountKeypad = useNumericKeypad({
    onConfirm: handleChangePercentage,
    initialValue: '',
    title: t('Product Discount'),
    maxLength: 6,
    allowDecimal: true,
  });

  const fallbackPriceKeypad = useNumericKeypad({
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
      <div className="col-span-10 flex h-full flex-row items-center justify-start px-2 py-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-sm font-semibold">
            {item.name} <span className="text-muted-foreground font-normal text-xs">({item.unit_name})</span>
            {item.mode === 'wholesale' && (
              <span className="ms-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {t('Wholesale')}
              </span>
            )}
          </p>
          <div className="flex flex-row items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenPriceKeypad) {
                  onOpenPriceKeypad(item);
                } else {
                  fallbackPriceKeypad.openKeypad();
                }
              }}
              className={CART_ITEM_LINK_CLASSES}
            >
              {t('Price')}: <span className="font-medium text-foreground">{formatCurrency(displayedPrice)}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenDiscountKeypad) {
                  onOpenDiscountKeypad(item);
                } else {
                  fallbackDiscountKeypad.openKeypad();
                }
              }}
              className={CART_ITEM_LINK_CLASSES}
            >
              {t('Discount')} {item.discount_percentage || 0}%:{' '}
              <span className="font-medium text-foreground">{formatCurrency(item.discount || 0)}</span>
            </button>
          </div>
        </div>
        <div className="ms-auto flex shrink-0 items-center gap-1">
          {isPosOptionEnabled(options, POS_OPTION_KEYS.allowWholesalePrice) && (
            <Button
              variant="ghost"
              size="icon"
              className={`active:scale-95 h-9 w-9 ${item.mode === 'wholesale' ? 'bg-emerald-500/20 text-emerald-600' : 'hover:bg-emerald-500/10 hover:text-emerald-500/80'}`}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleWholesale();
              }}
              title={item.mode === 'wholesale' ? t('Switch to retail price') : t('Switch to wholesale price')}
              aria-label={t('Toggle wholesale price')}
            >
              <Award className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 active:scale-95 h-9 w-9"
            onClick={(e) => {
              e.stopPropagation();
              removeFromCart(item);
            }}
            aria-label={t('Remove from cart', { name: item.name || '' })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showQuantity && (
        <div className="col-span-2 flex h-14 items-center justify-center border-s">
          {isEditing ? (
            <Input
              type="text"
              value={quantityInput}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              onKeyDown={handleKeyDown}
              className="h-8 w-14 p-1 text-center text-xs"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="active:scale-95 h-7 w-7 rounded-full"
                onClick={handleDecrement}
                aria-label={t('Decrease quantity')}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span
                className="min-w-[24px] cursor-pointer rounded px-1 py-0.5 text-center text-xs font-semibold text-foreground hover:bg-muted active:bg-muted"
                onClick={() => {
                  if (onOpenQuantityKeypad) {
                    onOpenQuantityKeypad(item);
                  } else {
                    setIsEditing(true);
                  }
                }}
                title={t('Click to edit quantity')}
              >
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="active:scale-95 h-7 w-7 rounded-full"
                onClick={handleIncrement}
                aria-label={t('Increase quantity')}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="col-span-2 flex h-14 items-center justify-center border-s text-center text-xs font-bold text-foreground">
        {formatCurrency(itemTotal)}
      </div>

      {!onOpenDiscountKeypad && <NumericKeypadDialog {...fallbackDiscountKeypad.keypadProps} />}
      {!onOpenPriceKeypad && <NumericKeypadDialog {...fallbackPriceKeypad.keypadProps} />}
    </div>
  );
}
