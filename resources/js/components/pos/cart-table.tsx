'use client';

import CartItemComponent from '@/components/pos/cart-item';
import { Button } from '@/components/ui/button';
import { NumericKeypadDialog } from '@/components/ui/numeric-keypad-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { OrderProduct } from '@/types/models/order-product';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CartTableProps {
    cart: OrderProduct[];
    removeFromCart: (product: OrderProduct) => void;
    updateQuantity: (product: OrderProduct, quantity: number) => void;
    updatePrice: (product: OrderProduct, price: number) => void;
    updateDiscountPercentage: (product: OrderProduct, price: number) => void;
    clearCart: () => void;
    removeSelectedItems: () => void;
    selectedItems: string[];
    toggleItemSelection: (productId: string) => void;
    selectAllItems: () => void;
    deselectAllItems: () => void;
}

type ActiveKeypadState = {
    item: OrderProduct;
    type: 'price' | 'discount' | 'quantity';
} | null;

export default function CartTable({
    cart,
    removeFromCart,
    updateQuantity,
    updatePrice,
    clearCart,
    updateDiscountPercentage,
    removeSelectedItems,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
}: CartTableProps) {
    const { t } = useTranslation();
    const { options } = usePOS();
    const showQuantity = options[POS_OPTION_KEYS.showQuantity] !== false;
    const allSelected = cart.length > 0 && selectedItems.length === cart.length;
    const someSelected = selectedItems.length > 0 && selectedItems.length < cart.length;

    // Centralized single keypad dialog for all cart items (prevents mounting 2N modals)
    const [activeKeypad, setActiveKeypad] = useState<ActiveKeypadState>(null);

    const handleKeypadConfirm = (value: string) => {
        if (!activeKeypad) return;
        const numValue = Number.parseFloat(value);
        if (isNaN(numValue)) return;

        if (activeKeypad.type === 'quantity') {
            const qty = Math.max(0, Math.floor(numValue));
            updateQuantity(activeKeypad.item, qty);
        } else if (activeKeypad.type === 'price') {
            updatePrice(activeKeypad.item, Math.max(0, numValue));
        } else if (activeKeypad.type === 'discount') {
            updateDiscountPercentage(activeKeypad.item, Math.max(0, Math.min(100, numValue)));
        }
        setActiveKeypad(null);
    };

    const keypadTitle = activeKeypad
        ? activeKeypad.type === 'quantity'
            ? t('Item Quantity')
            : activeKeypad.type === 'price'
              ? t('Item Price')
              : t('Item Discount')
        : '';

    const keypadInitialValue = activeKeypad
        ? activeKeypad.type === 'quantity'
            ? String(activeKeypad.item.quantity || '')
            : activeKeypad.type === 'price'
              ? String(activeKeypad.item.price_without_tax || activeKeypad.item.unit_price || '')
              : String(activeKeypad.item.discount_percentage || '')
        : '';

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Perfectly Aligned Header: 44px Checkbox + Data Grid */}
            <div className="bg-muted/50 flex h-12 items-center border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center ps-2">
                    <label className="relative flex h-11 w-11 cursor-pointer items-center justify-center">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(input) => {
                                if (input) {
                                    input.indeterminate = someSelected;
                                }
                            }}
                            onChange={() => {
                                if (allSelected) {
                                    deselectAllItems();
                                } else {
                                    selectAllItems();
                                }
                            }}
                            className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                        />
                    </label>
                </div>

                <div className={cn('grid flex-1 items-center', showQuantity ? 'grid-cols-14' : 'grid-cols-12')}>
                    <div className="col-span-10 px-2">{t('Product')}</div>
                    {showQuantity && (
                        <div className="col-span-2 border-s text-center">{t('Quantity')}</div>
                    )}
                    <div className="col-span-2 border-s text-center">{t('Total')}</div>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                {/* Batch Selection Action Bar */}
                {cart.length > 0 && (
                    <div className="bg-muted/25 flex items-center justify-between border-b px-3 py-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                            {selectedItems.length > 0
                                ? t('{entries} items selected', { entries: selectedItems.length })
                                : t('{count} items in cart', { count: cart.length })}
                        </span>
                        <div className="flex items-center gap-2">
                            {selectedItems.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="active:scale-95 h-7 px-2.5 text-xs font-medium"
                                    onClick={removeSelectedItems}
                                >
                                    <Trash2 className="me-1 h-3 w-3" />
                                    {t('Delete Selected')}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="active:scale-95 h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                                onClick={clearCart}
                            >
                                <Trash2 className="me-1 h-3 w-3" />
                                {t('Clear All')}
                            </Button>
                        </div>
                    </div>
                )}

                <ScrollArea className="min-h-[150px] flex-1">
                    {cart.length > 0 ? (
                        <div className="divide-y divide-border/70 pb-12">
                            {cart.map((item) => {
                                const itemKey = item._uuid || `${item.product_id}-${item.unit_id}`;
                                return (
                                    <div key={itemKey} className="hover:bg-muted/20 flex items-center transition-colors">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center ps-2">
                                            <label className="relative flex h-11 w-11 cursor-pointer items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(itemKey)}
                                                    onChange={() => toggleItemSelection(itemKey)}
                                                    className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                                                />
                                            </label>
                                        </div>
                                        <div className="flex-1">
                                            <CartItemComponent
                                                item={item}
                                                updatePrice={updatePrice}
                                                updateDiscountPercentage={updateDiscountPercentage}
                                                removeFromCart={removeFromCart}
                                                updateQuantity={updateQuantity}
                                                showQuantity={showQuantity}
                                                onOpenPriceKeypad={(itm) => setActiveKeypad({ item: itm, type: 'price' })}
                                                onOpenDiscountKeypad={(itm) => setActiveKeypad({ item: itm, type: 'discount' })}
                                                onOpenQuantityKeypad={(itm) => setActiveKeypad({ item: itm, type: 'quantity' })}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex h-full min-h-[260px] flex-col items-center justify-center p-8 text-center">
                            <div className="bg-muted/40 border-border/80 mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-inner">
                                <ShoppingBag className="text-muted-foreground/60 h-8 w-8" />
                            </div>
                            <h3 className="text-foreground text-sm font-semibold">{t('Cart is Empty')}</h3>
                            <p className="text-muted-foreground mt-1 max-w-xs text-xs">
                                {t('Scan a barcode or tap products from the catalog to begin an order')}
                            </p>
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Centralized Numeric Keypad for Cart Table */}
            {activeKeypad && (
                <NumericKeypadDialog
                    open={true}
                    onOpenChange={(open) => { if (!open) setActiveKeypad(null); }}
                    onConfirm={handleKeypadConfirm}
                    initialValue={keypadInitialValue}
                    title={keypadTitle}
                    allowDecimal={activeKeypad.type !== 'quantity'}
                    maxLength={activeKeypad.type === 'quantity' ? 4 : 8}
                />
            )}
        </div>
    );
}
