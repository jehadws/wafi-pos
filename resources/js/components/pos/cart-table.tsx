'use client';

import CartItemComponent from '@/components/pos/cart-item';
import { Button } from '@/components/ui/button';
import { NumericKeypadDialog } from '@/components/ui/numeric-keypad-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/lib/i18n';
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
            {/* Panel header — mockup style: select-all + "Cart (n)" + batch actions */}
            <div className="flex h-12 shrink-0 items-center gap-2 border-b px-2">
                <label className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center">
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
                        className="text-primary focus:ring-primary h-4 w-4 rounded border-input"
                        aria-label={t('Select all items')}
                    />
                </label>
                <span className="text-foreground text-sm font-bold">{t('Cart')}</span>
                <span className="text-muted-foreground truncate text-xs">
                    {selectedItems.length > 0
                        ? t('{entries} items selected', { entries: selectedItems.length })
                        : cart.length > 0
                          ? t('{count} items in cart', { count: cart.length })
                          : ''}
                </span>

                <div className="ms-auto flex items-center gap-2">
                    {selectedItems.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="active:scale-95 h-8 px-2.5 text-xs font-medium"
                            onClick={removeSelectedItems}
                        >
                            <Trash2 className="me-1 h-3 w-3" />
                            {t('Delete Selected')}
                        </Button>
                    )}
                    {cart.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground active:scale-95 h-8 px-2.5 text-xs font-medium"
                            onClick={clearCart}
                        >
                            <Trash2 className="me-1 h-3 w-3" />
                            {t('Clear All')}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                <ScrollArea className="min-h-[150px] flex-1">
                    {cart.length > 0 ? (
                        <div className="w-full divide-y divide-border/60 pb-6">
                            {cart.map((item) => {
                                const itemKey = item._uuid || `${item.product_id}-${item.unit_id}`;
                                return (
                                    <div key={itemKey} className="group flex items-center transition-colors hover:bg-muted/30">
                                        <label className="relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(itemKey)}
                                                onChange={() => toggleItemSelection(itemKey)}
                                                className="text-primary focus:ring-primary h-4 w-4 rounded border-input"
                                                aria-label={t('Select item')}
                                            />
                                        </label>
                                        <div className="min-w-0 flex-1">
                                            <CartItemComponent
                                                item={item}
                                                updatePrice={updatePrice}
                                                updateDiscountPercentage={updateDiscountPercentage}
                                                removeFromCart={removeFromCart}
                                                updateQuantity={updateQuantity}
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
